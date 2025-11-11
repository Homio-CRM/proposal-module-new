import { NextRequest, NextResponse } from 'next/server'
import { postToOperations } from '@/lib/operationsClient'
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { locationId, contactId, ...contactData } = body

        if (!locationId) {
            return NextResponse.json({ error: 'Missing locationId' }, { status: 400 })
        }

        if (!contactId) {
            return NextResponse.json({ error: 'Missing contactId' }, { status: 400 })
        }

        const apiKey = process.env.SUPABASE_OPERATIONS_ANON_KEY || ''
        if (!apiKey) {
            return NextResponse.json({ error: 'SUPABASE_OPERATIONS_ANON_KEY not configured' }, { status: 500 })
        }

        const upstreamResponse = await postToOperations(
            'ghl-update-contact',
            { contactId, ...contactData },
            { apikey: apiKey },
            locationId
        )

        const data = await upstreamResponse.json().catch(() => null)
        const status = upstreamResponse.status
        return NextResponse.json(data ?? {}, { status })
    } catch (error) {
        console.error('[operations/contact/update] Update error:', error)
        return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }
}
