import { NextRequest, NextResponse } from 'next/server'
import { postToOperations } from '@/lib/operationsClient'
import util from 'util'

export async function POST(req: NextRequest) {
    try {
        const { contactId, locationId } = await req.json()

        if (!contactId || !locationId) {
            return NextResponse.json({ error: 'Missing contactId or locationId' }, { status: 400 })
        }

        const apiKey = process.env.SUPABASE_OPERATIONS_ANON_KEY || ''
        if (!apiKey) {
            return NextResponse.json({ error: 'SUPABASE_OPERATIONS_ANON_KEY not configured' }, { status: 500 })
        }

        const upstreamResponse = await postToOperations(
            'ghl-get-contact-by-id',
            { contactId },
            { apikey: apiKey },
            locationId
        )

        const data = await upstreamResponse.json().catch(() => null)
        console.log('[operations/contact] Upstream response:', upstreamResponse.status)
        console.log(util.inspect(data, { depth: null, colors: false, maxArrayLength: null }))
        const status = upstreamResponse.status
        return NextResponse.json(data ?? {}, { status })
    } catch (error) {
        console.error('[operations/contact] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
    }
}


