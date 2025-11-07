import { NextRequest, NextResponse } from 'next/server'

async function fetchCustomFieldsFromUpstream(locationId: string, model?: string) {
    const apiKey = process.env.SUPABASE_OPERATIONS_ANON_KEY || ''
    if (!apiKey) {
        throw new Error('SUPABASE_OPERATIONS_ANON_KEY not configured')
    }

    const baseUrl = process.env.SUPABASE_OPERATIONS_URL || ''
    const url = `${baseUrl.replace(/\/$/, '')}/ghl-get-custom-fields-v1${model ? `?model=${model}` : ''}`
    
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'locationId': locationId
        }
    })

    const data = await response.json().catch(() => null)
    
    return { data, status: response.status }
}

export async function POST(req: NextRequest) {
    try {
        
        const { locationId, model } = await req.json()
        const headerLocationId = req.headers.get('locationId')

        const finalLocationId = locationId || headerLocationId

        if (!finalLocationId) {
            return NextResponse.json({ error: 'Missing locationId' }, { status: 400 })
        }

        const { data, status } = await fetchCustomFieldsFromUpstream(finalLocationId, model)
        return NextResponse.json(data ?? {}, { status })
    } catch {
        return NextResponse.json({ error: 'Failed to fetch custom fields' }, { status: 500 })
    }
}