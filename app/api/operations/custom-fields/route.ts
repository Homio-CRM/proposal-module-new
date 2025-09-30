import { NextRequest, NextResponse } from 'next/server'
import util from 'util'

async function fetchCustomFieldsFromUpstream(locationId: string, model?: string) {
    const apiKey = process.env.SUPABASE_OPERATIONS_ANON_KEY || ''
    if (!apiKey) {
        throw new Error('SUPABASE_OPERATIONS_ANON_KEY not configured')
    }

    const baseUrl = process.env.SUPABASE_OPERATIONS_URL || ''
    const url = `${baseUrl.replace(/\/$/, '')}/ghl-get-custom-fields-v1${model ? `?model=${model}` : ''}`
    
    console.log('🚀 Calling upstream URL:', url)
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'locationId': locationId
        }
    })

    const data = await response.json().catch(() => null)
    console.log('[operations/custom-fields] Upstream response:', response.status)
    console.log(util.inspect(data, { depth: null, colors: false, maxArrayLength: null }))
    
    return { data, status: response.status }
}

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 POST /api/operations/custom-fields called')
        
        const { locationId, model } = await req.json()
        const headerLocationId = req.headers.get('locationId')

        const finalLocationId = locationId || headerLocationId

        if (!finalLocationId) {
            return NextResponse.json({ error: 'Missing locationId' }, { status: 400 })
        }

        console.log('📊 Request details:', { locationId: finalLocationId, model })

        const { data, status } = await fetchCustomFieldsFromUpstream(finalLocationId, model)
        return NextResponse.json(data ?? {}, { status })
    } catch (error) {
        console.error('[operations/custom-fields] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch custom fields' }, { status: 500 })
    }
}