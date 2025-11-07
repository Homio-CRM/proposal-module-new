import { NextRequest, NextResponse } from 'next/server'
import { postToOperations } from '@/lib/operationsClient'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const headerLocation = req.headers.get('locationid') || req.headers.get('locationId')
        const locationId = headerLocation || body.locationId
        const { opportunityId, customFields, custom_fields } = body
        const fieldsArray = Array.isArray(customFields) ? customFields : Array.isArray(custom_fields) ? custom_fields : null

        if (!locationId) {
            return NextResponse.json({ error: 'Missing locationId' }, { status: 400 })
        }

        if (!opportunityId) {
            return NextResponse.json({ error: 'Missing opportunityId' }, { status: 400 })
        }

        if (!fieldsArray) {
            return NextResponse.json({ error: 'Missing customFields' }, { status: 400 })
        }

        const apiKey = process.env.SUPABASE_OPERATIONS_ANON_KEY || ''
        if (!apiKey) {
            return NextResponse.json({ error: 'SUPABASE_OPERATIONS_ANON_KEY not configured' }, { status: 500 })
        }

        const requestPayload = { opportunityId, customFields: fieldsArray }

        const upstreamResponse = await postToOperations(
            'ghl-update-opportunity',
            requestPayload,
            { apikey: apiKey },
            locationId
        )

        const data = await upstreamResponse.json().catch(() => null)
        const status = upstreamResponse.status
        return NextResponse.json(data ?? {}, { status })
    } catch (error) {
        console.error('[operations/opportunity/update] Error:', error)
        return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 })
    }
}


