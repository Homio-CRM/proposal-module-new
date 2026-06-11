// ghl-update-contact — Edge Function COMPARTILHADA do projeto Homio Operations
// (Supabase ref: uyaemczdotxlvowytwkt). NAO e deployada por este repo (Next):
// o deploy e feito via Supabase CLI direto no Operations. Este arquivo e o
// source-of-record (o modulo de propostas depende desta edge via
// /api/operations/contact/{update,upsert} -> ProposalForm). Excluida do
// type-check do Next em tsconfig ("exclude": [..., "supabase/functions"]).
//
// Deploy:
//   npx supabase functions deploy ghl-update-contact --project-ref uyaemczdotxlvowytwkt
//
// Comportamento: PUT /contacts/{id} por padrao; se o contactId for placeholder
// ("new-contact") ou se o PUT bater em duplicidade (location com "nao permitir
// contatos duplicados"), resolve via POST /contacts/upsert (dedup por
// email/telefone, retorna o contato canonico).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GHL_VERSION = "2021-07-28";
const LOCATION_TOKEN_FUNCTION = Deno.env.get("LOCATION_TOKEN_FUNCTION") || "ghl-location-auth";

const ALLOW_HEADERS = "Content-Type, Authorization, locationId, location_id, contactId";
function cors(extra: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS", // <- POST aqui
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    ...extra,
  };
}

function stripBearer(s: unknown) {
  return String(s || "").replace(/^Bearer\s+/i, "");
}
function pruneUndefined<T extends Record<string, any>>(obj: T) {
  const pruned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) pruned[k] = v;
  return pruned;
}

// Normaliza dateOfBirth -> YYYY-MM-DD quando possível (sem mudar o nome do campo)
function normalizeDateOfBirth(input: unknown): string | unknown {
  if (input == null) return input;
  if (typeof input === "number") {
    const ms = input < 10_000_000_000 ? input * 1000 : input;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? input : d.toISOString().slice(0, 10);
  }
  if (typeof input !== "string") return input;
  const s = input.trim();
  if (!s) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);       // ISO
  const dmy = /^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/.exec(s);       // dd/mm/yyyy
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const ymd = /^(\d{4})[\/.-](\d{2})[\/.-](\d{2})$/.exec(s);       // yyyy/mm/dd
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  if (/^\d{10,13}$/.test(s)) return normalizeDateOfBirth(Number(s)); // epoch string
  return s;
}

async function getLocationAccessToken(locationId: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados");
  }
  const fnUrl = `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/${LOCATION_TOKEN_FUNCTION}`;
  const resp = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ locationId }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Falha ao obter location token: ${resp.status} ${resp.statusText} - ${text}`);
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}
  const token =
    data?.access_token ?? data?.accessToken ?? data?.token ??
    data?.data?.access_token ?? data?.data?.accessToken;
  if (!token) throw new Error(`Função ${LOCATION_TOKEN_FUNCTION} não retornou access_token. Payload: ${text}`);
  return stripBearer(String(token));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: cors({ "Content-Type": "application/json" }),
    });
  }

  try {
    const ct = req.headers.get("content-type") || "";
    const raw = await req.text();
    if (!ct.includes("application/json")) {
      return new Response(JSON.stringify({
        error: "Unsupported Content-Type",
        hint: 'Use "Content-Type: application/json". Envie os campos exatamente como na documentação.',
      }), { status: 415, headers: cors({ "Content-Type": "application/json" }) });
    }

    let body: Record<string, any> = {};
    try { body = raw ? JSON.parse(raw) : {}; }
    catch (e) {
      console.error("JSON parse error:", e, "raw body:", raw.slice(0, 200));
      return new Response(JSON.stringify({ error: "Invalid JSON body", details: e instanceof Error ? e.message : "Unknown JSON parse error" }), {
        status: 400, headers: cors({ "Content-Type": "application/json" }),
      });
    }

    // contactId por header OU body (sem aliases)
    const headerContactId = req.headers.get("contactId") || "";
    const contactId = String(headerContactId || body.contactId || "");
    if (!contactId) {
      return new Response(JSON.stringify({
        error: "Missing contactId",
        hint: 'Envie "contactId" no header ou no body; será usado no path /contacts/:contactId.',
      }), { status: 400, headers: cors({ "Content-Type": "application/json" }) });
    }

    // locationId para buscar o token (não é injetado no body de update)
    const headerLocationId =
      req.headers.get("locationId") || req.headers.get("location_id") || req.headers.get("locationid") || "";
    const bodyLocationId = String(body.locationId || "");
    const locationId = String(headerLocationId || bodyLocationId || "");
    if (!locationId) {
      return new Response(JSON.stringify({
        error: "Missing locationId",
        hint: 'Envie "locationId" no header (recomendado) ou no body; é necessário para obter o token da subconta.',
      }), { status: 400, headers: cors({ "Content-Type": "application/json" }) });
    }

    // Corpo final exatamente como o cliente enviou (ou body.payload, se preferir enviar assim)
    const base = (typeof body.payload === "object" && body.payload) ? body.payload : body;
    const outBody: Record<string, any> = { ...base };

    // Ajustes controlados:
    // - não envie contactId no corpo (vai no path)
    // - normaliza dateOfBirth, se presente
    delete outBody.contactId;
    if (outBody.dateOfBirth !== undefined) {
      outBody.dateOfBirth = normalizeDateOfBirth(outBody.dateOfBirth);
    }

    // Token da subconta + headers comuns da API GHL
    const accessToken = await getLocationAccessToken(locationId);
    const ghlHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Version: GHL_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Upsert nativo do GHL: casa por email/telefone na location e cria-ou-atualiza,
    // retornando o contato canonico. Usado quando nao ha contactId real, ou como
    // fallback quando o PUT por id bate em duplicidade (location com
    // "nao permitir contatos duplicados" ligado).
    const upsertBody = pruneUndefined({ ...outBody, locationId });
    async function ghlUpsert() {
      const r = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
        method: "POST",
        headers: ghlHeaders,
        body: JSON.stringify(upsertBody),
      });
      return { r, t: await r.text() };
    }

    // contactId placeholder ("new-contact"/"new"/vazio) => nao da pra fazer PUT por id
    const hasRealId = !!contactId && !/^new(-contact)?$/i.test(contactId);

    let resp: Response;
    let txt: string;
    let resolvedVia: string;

    if (hasRealId) {
      resp = await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}`, {
        method: "PUT",
        headers: ghlHeaders,
        body: JSON.stringify(pruneUndefined(outBody)),
      });
      txt = await resp.text();
      resolvedVia = "put";

      // PUT falhou por duplicidade de email/telefone => o contato ja existe na
      // location; resolve via upsert (atualiza o contato canonico que detem o dado).
      if (resp.status === 400 && /duplicat/i.test(txt)) {
        console.log(`ghl-update-contact: PUT duplicado pra contactId=${contactId}; tentando upsert. detalhe: ${txt.slice(0, 300)}`);
        const up = await ghlUpsert();
        resp = up.r;
        txt = up.t;
        resolvedVia = "upsert_after_dup";
      }
    } else {
      const up = await ghlUpsert();
      resp = up.r;
      txt = up.t;
      resolvedVia = "upsert";
    }

    if (!resp.ok) {
      console.error(`GHL ${resolvedVia} contact error: ${resp.status} - ${txt}`);
      return new Response(JSON.stringify({
        error: `Failed to update contact: ${resp.status} ${resp.statusText}`,
        details: txt,
        resolvedVia,
        sentBodySample: Object.fromEntries(Object.entries(upsertBody).slice(0, 25)),
      }), { status: resp.status, headers: cors({ "Content-Type": "application/json" }) });
    }

    let data: any = {};
    try { data = txt ? JSON.parse(txt) : {}; } catch { data = { ok: true }; }
    return new Response(JSON.stringify(data), {
      status: 200, headers: cors({ "Content-Type": "application/json" }),
    });

  } catch (err) {
    console.error("Edge Function Error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: err instanceof Error ? err.message : "Unknown error",
    }), { status: 500, headers: cors({ "Content-Type": "application/json" }) });
  }
});
