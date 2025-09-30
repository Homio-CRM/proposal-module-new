export async function postToOperations(
    path: string, 
    body: unknown, 
    extraHeaders: Record<string, string> = {},
    locationId?: string
): Promise<Response> {
    const baseUrl = process.env.SUPABASE_OPERATIONS_URL || ''
    const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...extraHeaders,
    }
    
    // Adicionar locationId no header se fornecido
    if (locationId) {
        headers['locationId'] = locationId
    }
    
    const anonKey = process.env.SUPABASE_OPERATIONS_ANON_KEY || ''
    if (anonKey) {
        headers.Authorization = `Bearer ${anonKey}`
    }
    
    return fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        cache: 'no-store',
    })
}


