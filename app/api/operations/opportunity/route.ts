import { NextRequest, NextResponse } from 'next/server'
import { postToOperations } from '@/lib/operationsClient'
import util from 'util'

export async function POST(req: NextRequest) {
    try {
        const { opportunityId, locationId } = await req.json()

        if (!opportunityId || !locationId) {
            return NextResponse.json({ error: 'Missing opportunityId or locationId' }, { status: 400 })
        }

        const apiKey = process.env.SUPABASE_OPERATIONS_ANON_KEY || ''
        if (!apiKey) {
            return NextResponse.json({ error: 'SUPABASE_OPERATIONS_ANON_KEY not configured' }, { status: 500 })
        }

        const upstreamResponse = await postToOperations(
            'ghl-get-opportunity-by-id',
            { opportunityId },
            { apikey: apiKey },
            locationId
        )

        const data = await upstreamResponse.json().catch(() => null)
        const status = upstreamResponse.status
        return NextResponse.json(data ?? {}, { status })
    } catch (error) {
        console.error('[operations/opportunity] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 })
    }
}


