import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const isServer = typeof window === 'undefined'

type SessionTokens = { access_token: string; refresh_token: string }
type RefreshOpts = { refresh_token: string }

let browserClient: SupabaseClient | null = null
let serverClient: SupabaseClient | null = null

async function getConfig(): Promise<{ url: string; anonKey: string }> {
    if (isServer) {
        return { url: process.env.SUPABASE_URL as string, anonKey: process.env.SUPABASE_ANON_KEY as string }
    }
    const res = await fetch('/api/supabase-config')
    return res.json()
}

export async function getSupabase(): Promise<SupabaseClient> {
    if (isServer) {
        if (!serverClient) {
            const { url, anonKey } = await getConfig()
            serverClient = createClient(url, anonKey, { auth: { autoRefreshToken: true } })
        }
        return serverClient
    }
    if (!browserClient) {
        const { url, anonKey } = await getConfig()
        browserClient = createClient(url, anonKey, { auth: { autoRefreshToken: true } })
    }
    return browserClient
}

export const supabase: SupabaseClient | {
    auth: {
        setSession: (session: SessionTokens) => Promise<unknown>
        getSession: () => Promise<unknown>
        signOut: () => Promise<unknown>
        refreshSession: (options: RefreshOpts) => Promise<unknown>
        signInWithPassword: (creds: { email: string; password: string }) => Promise<unknown>
    }
} = isServer
    ? createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string, { auth: { autoRefreshToken: true } })
    : {
        auth: {
            setSession: async (session: SessionTokens) => (await getSupabase()).auth.setSession(session),
            getSession: async () => (await getSupabase()).auth.getSession(),
            signOut: async () => (await getSupabase()).auth.signOut(),
            refreshSession: async (options: RefreshOpts) => (await getSupabase()).auth.refreshSession(options),
            signInWithPassword: async (creds: { email: string; password: string }) => (await getSupabase()).auth.signInWithPassword(creds)
        }
    }
