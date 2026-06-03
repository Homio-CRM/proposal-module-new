import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const LOCATION_TOKEN_FUNCTION = Deno.env.get("LOCATION_TOKEN_FUNCTION") || "ghl-location-auth";

const GHL_VERSION = "2021-07-28";
const BASE_URL = "https://services.leadconnectorhq.com";

const MIVITA_LOCATION_ID = "Ew4LzbKZmyOVYwv4iwDI";
const MIVITA_PIPELINE_ID = "e1XFmBDuU3FFyvOrXZ2L";
const STAGE_AGENDAMENTO = "61b1cf3d-c0c3-4453-a39f-6a4d9ece45e7";
const STAGE_PROPOSTA = "01fbb3bf-af7e-4318-bc47-524a12ef20de";
const CF_EMPREENDIMENTO = "EVdLCbbyeUrBrMIFmZVX";
const CF_FINANCE_PART = "1KAV5l9bY5x1qRkGJ2tr";

const PLACEHOLDER_CONTA = "CADASTRAR CONTA";

const CONTAS_BANCARIAS: Array<{ match: string; conta: string }> = [
  {
    match: "quartzo",
    conta: "Banco: SICOOB - 756 Agência: 3007 (SICOOB LESTE CAPIXABA) Conta Corrente: 256374-6 CNPJ: 51.452.681/0001-60 EMPREENDIMENTO IMOBILIARIO MIVITA 006 SPE LTDA",
  },
  {
    match: "serena",
    conta: "Banco: Sicoob (756) Agencia: 3007-4 Conta Corrente: 195.866-6 EMPREENDIMENTO IMOBILIARIO MIVITA 005 SPE LTDA CNPJ: 44.639.513/0001-12",
  },
  {
    match: "lago",
    conta: "Banco: 756 - BANCO COOPERATIVO DO BRASIL S.A. Agência: 3007 SICOOB LESTE CAPIXABA Conta corrente: 175840-3 CNPJ: 41.882.405.0001/88 Nome favorecido: EMPREENDIMENTO IMOBILIÁRIO MIVITA 004 SPE",
  },
];

function getContaBancaria(empreendimento: string | null | undefined): { conta: string; mapped: boolean } {
  if (!empreendimento) return { conta: PLACEHOLDER_CONTA, mapped: false };
  const lower = empreendimento.toLowerCase();
  for (const m of CONTAS_BANCARIAS) {
    if (lower.includes(m.match)) return { conta: m.conta, mapped: true };
  }
  return { conta: PLACEHOLDER_CONTA, mapped: false };
}

interface InstallmentInput {
  id?: string;
  condition: string;
  value: number;
  quantity: number;
  date: string;
  dates?: string[];
  totalAmount: number;
}

function montarFluxoPagamento(installments: InstallmentInput[], contaBancaria: string): string {
  const totalProposalValue = installments.reduce(
    (acc, p) => acc + (Number(p.totalAmount) || 0),
    0,
  );

  const parcelas = installments.map((p) => {
    let tipo = String(p.condition || "").toLowerCase();
    if (tipo === "intermediarias" || tipo === "semestrais") tipo = "Intermediárias";
    else if (tipo === "sinal") tipo = "Sinal";
    else if (tipo === "mensais") tipo = "Mensais";
    else if (tipo === "anuais") tipo = "Anuais";
    else if (tipo.includes("financiamento")) tipo = "Financiamento";
    else if (tipo.includes("unica")) tipo = "Parcela única";

    return {
      type: tipo,
      totalValue: Number(p.totalAmount) || 0,
      amount: Number(p.quantity) || 0,
      installmentsValue: Number(p.value) || 0,
      paymentDate: p.date,
      dates: p.dates || [],
    };
  });

  const fmtValor = (v: number) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtData = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });

  let fluxo = `\nO preço ajustado para a presente promessa de compra e venda é, nesta data, de ${fmtValor(totalProposalValue)}, sujeito aos reajustamentos, conforme indicado no campo 05 deste Quadro Resumo, para pagamento na forma seguinte:\n\n`;

  const ordemTipos = ["Sinal", "Mensais", "Anuais", "Intermediárias", "Parcela única", "Financiamento"];
  const letras = ["a", "b", "c", "d", "e", "f"];
  let idx = 0;

  for (const tipo of ordemTipos) {
    const grupo = parcelas.filter((p) => p.type.toLowerCase() === tipo.toLowerCase());
    if (!grupo.length) continue;
    const letra = letras[idx++];

    if (tipo === "Sinal") {
      const totalSinal = grupo.reduce((s, p) => s + p.totalValue, 0);
      const detalhes = grupo
        .map((p) => `${fmtValor(p.totalValue)} no dia ${fmtData(p.paymentDate)}`)
        .join(" e ");
      fluxo += `${letra}) SINAL: ${fmtValor(totalSinal)}, pagos ${detalhes} por meio de transferência bancária TED para a seguinte conta do PROMITENTE VENDEDOR:\n\n${contaBancaria}\n\n`;
    } else if (tipo === "Mensais") {
      const g = grupo[0];
      const pct = totalProposalValue ? ((g.totalValue / totalProposalValue) * 100).toFixed(2) : "0.00";
      fluxo += `${letra}) MENSAIS: ${fmtValor(g.totalValue)} divididos em ${g.amount} parcelas de ${fmtValor(g.installmentsValue)} cada, que somadas correspondem a ${pct}% do preço do imóvel, reajustáveis de acordo com o índice pactuado, vencendo a primeira em ${fmtData(g.paymentDate)} e as seguintes todas no mesmo dia ou no primeiro dia útil subsequente, sendo pagas por boleto ou transferência bancária TED para a conta do PROMITENTE VENDEDOR.\n\n`;
    } else if (tipo === "Anuais") {
      const g = grupo[0];
      const pct = totalProposalValue ? ((g.totalValue / totalProposalValue) * 100).toFixed(2) : "0.00";
      fluxo += `${letra}) ANUAIS: ${fmtValor(g.totalValue)} divididos em ${g.amount} parcelas de ${fmtValor(g.installmentsValue)} cada, que somadas correspondem a ${pct}% do preço do imóvel, reajustáveis de acordo com o índice pactuado, vencendo a primeira em ${fmtData(g.paymentDate)} e as seguintes todas no mesmo dia ou no primeiro dia útil subsequente, sendo pagas por boleto ou transferência bancária TED para a conta do PROMITENTE VENDEDOR.\n\n`;
    } else if (tipo === "Intermediárias") {
      const totalInt = grupo.reduce((s, p) => s + p.totalValue, 0);
      const totalParcelasReal = grupo.reduce((acc, p) => acc + (p.amount || 1), 0);
      const pct = totalProposalValue ? ((totalInt / totalProposalValue) * 100).toFixed(2) : "0.00";
      const datasFlat: string[] = [];
      for (const g of grupo) {
        if (g.dates && g.dates.length > 0) datasFlat.push(...g.dates);
        else if (g.paymentDate) datasFlat.push(g.paymentDate);
      }
      const datas = datasFlat.map(fmtData);
      fluxo += `${letra}) INTERMEDIÁRIAS: ${fmtValor(totalInt)} divididos em ${totalParcelasReal} parcelas de ${fmtValor(grupo[0].installmentsValue)} cada, que somadas correspondem a ${pct}% do preço do imóvel, reajustáveis de acordo com o índice pactuado, vencendo em ${datas.join(", ")}; todas as parcelas serão pagas por boleto ou transferência bancária TED para a conta do PROMITENTE VENDEDOR.\n\n`;
    } else if (tipo === "Parcela única") {
      const p = grupo[0];
      fluxo += `${letra}) PARCELA ÚNICA: ${fmtValor(p.installmentsValue)}, com vencimento em ${fmtData(p.paymentDate)}, reajustável conforme índice pactuado e paga por boleto ou TED à conta do PROMITENTE VENDEDOR.\n\n`;
    } else if (tipo === "Financiamento") {
      const p = grupo[0];
      fluxo += `${letra}) FINANCIAMENTO: 1 (uma) parcela no valor de ${fmtValor(p.installmentsValue)}, que deverá ser paga até 90 (noventa) dias após a conclusão da obra/emissão do Certificado de Conclusão (HABITE-SE), sendo facultado ao Promitente Comprador a quitação através de financiamento bancário, observadas as cláusulas gerais.\n\n`;
    }
  }

  fluxo += `É de ciência do(a)(s) ADQUIRENTE(S) que a data de vencimento das parcelas do preço, bem como a sua exigibilidade, não possui qualquer vínculo com o andamento ou conclusão da obra.`;
  return fluxo;
}

async function getLocationAccessToken(locationId: string): Promise<string> {
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
  if (!resp.ok) {
    throw new Error(`Falha location token: ${resp.status} ${text}`);
  }
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}
  const token =
    data?.access_token ??
    data?.accessToken ??
    data?.token ??
    data?.data?.access_token ??
    data?.data?.accessToken;
  if (!token) throw new Error(`ghl-location-auth não retornou access_token. Payload: ${text}`);
  return String(token).replace(/^Bearer\s+/i, "");
}

async function ghlGetOpportunity(opportunityId: string, accessToken: string) {
  const resp = await fetch(
    `${BASE_URL}/opportunities/${encodeURIComponent(opportunityId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: GHL_VERSION,
        Accept: "application/json",
      },
    },
  );
  const text = await resp.text();
  if (!resp.ok) throw new Error(`GET opportunity ${resp.status}: ${text}`);
  return JSON.parse(text);
}

async function ghlPutOpportunity(opportunityId: string, accessToken: string, body: unknown) {
  const resp = await fetch(
    `${BASE_URL}/opportunities/${encodeURIComponent(opportunityId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: GHL_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const text = await resp.text();
  if (!resp.ok) throw new Error(`PUT opportunity ${resp.status}: ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, locationId, location_id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const installments: InstallmentInput[] | undefined = body?.installments;
    const opportunityId: string | undefined = body?.opportunityId;
    const locationId: string | undefined = body?.locationId;

    if (!opportunityId) {
      return new Response(JSON.stringify({ ok: false, error: "Missing opportunityId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!locationId) {
      return new Response(JSON.stringify({ ok: false, error: "Missing locationId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (locationId !== MIVITA_LOCATION_ID) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Location não suportada por esta function",
        expected: MIVITA_LOCATION_ID,
        received: locationId,
      }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(installments) || installments.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "installments vazio ou ausente" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getLocationAccessToken(locationId);
    const oppData = await ghlGetOpportunity(opportunityId, accessToken);
    const opp = oppData?.opportunity ?? oppData;
    const customFields: any[] = opp?.customFields ?? [];

    const cf = customFields.find((c) => c?.id === CF_EMPREENDIMENTO);
    let empreendimento: string | null = null;
    if (cf) {
      const v = cf.fieldValue ?? cf.fieldValueArray ?? cf.fieldValueString;
      if (Array.isArray(v) && v.length > 0) empreendimento = String(v[0]);
      else if (typeof v === "string") empreendimento = v;
    }

    const { conta: contaBancaria, mapped } = getContaBancaria(empreendimento);
    const fluxoPagamento = montarFluxoPagamento(installments, contaBancaria);

    const putBody = (stageId: string) => ({
      pipelineId: MIVITA_PIPELINE_ID,
      pipelineStageId: stageId,
      customFields: [
        { id: CF_FINANCE_PART, key: "finance_part", field_value: fluxoPagamento },
      ],
    });

    await ghlPutOpportunity(opportunityId, accessToken, putBody(STAGE_AGENDAMENTO));
    await ghlPutOpportunity(opportunityId, accessToken, putBody(STAGE_PROPOSTA));

    return new Response(JSON.stringify({
      ok: true,
      message: "Cláusula atualizada com sucesso",
      empreendimento,
      empreendimento_mapeado: mapped,
      warning: mapped
        ? null
        : `Empreendimento "${empreendimento ?? "(vazio)"}" sem conta bancária mapeada. Cláusula gerada com placeholder "${PLACEHOLDER_CONTA}".`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("mivita-finance-part error:", err);
    return new Response(JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
