import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(
	supabaseUrl,
	serviceRoleKey,
	{ auth: {} }
)

export async function GET() {
	return NextResponse.json({ ok: true }, { status: 200 })
}

export async function OPTIONS() {
	return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const {
			agencyId,
			opportunityId,
			proposalDate,
			proposalName,
			responsible,
			reservedUntil,
			unit,
			unitId,
			primaryContact,
			secondaryContact,
			installments
		} = body as {
			agencyId: string
			opportunityId: string
			proposalDate: string
			proposalName?: string
			responsible: string
			reservedUntil?: string
			unit?: { number: string; tower: string; floor: string; buildingName?: string }
			unitId?: string
			primaryContact: { homioId?: string; name: string }
			secondaryContact?: { homioId?: string; name: string } | null
			installments: Array<{ type: string; amountPerInstallment: number; installmentsCount: number; totalAmount: number; startDate: string }>
		}

		const missing: string[] = []
		if (!agencyId) missing.push('agencyId')
		if (!opportunityId) missing.push('opportunityId')
		if (!proposalDate) missing.push('proposalDate')
		if (!responsible) missing.push('responsible')
		if (!unitId && !unit?.number) missing.push('unitId or unit.number')
		if (!unitId && !unit?.tower) missing.push('unitId or unit.tower')
		if (!unitId && !unit?.floor) missing.push('unitId or unit.floor')
		if (!primaryContact?.name) missing.push('primaryContact.name')
		if (missing.length) {
			return NextResponse.json({ error: 'Missing required fields', missing }, { status: 400 })
		}

		let resolvedUnitId: string | null = null
		if (unitId) {
			const { data: verify, error: verifyErr } = await supabaseAdmin
				.from('units')
				.select('id')
				.eq('id', unitId)
				.eq('agency_id', agencyId)
				.single()
			if (verifyErr || !verify) {
				return NextResponse.json({ error: 'Unit not found for agency', unitId, agencyId }, { status: 404 })
			}
			resolvedUnitId = verify.id as string
		} else if (unit) {
			const { data: unitRow, error: unitErr } = await supabaseAdmin
				.from('units')
				.select('id')
				.eq('number', unit.number)
				.eq('tower', unit.tower)
				.eq('floor', unit.floor)
				.eq('agency_id', agencyId)
				.single()
			if (unitErr || !unitRow) {
				return NextResponse.json({ error: 'Unit not found', criteria: { number: unit.number, tower: unit.tower, floor: unit.floor, agencyId } }, { status: 404 })
			}
			resolvedUnitId = unitRow.id as string
		}

		const upsertContact = async (c?: { homioId?: string; name: string } | null) => {
			if (!c || !c.name) return null as string | null
			
			// Se não temos homioId, buscar por nome para evitar duplicatas
			const searchKey = c.homioId || c.name
			const { data: found } = await supabaseAdmin
				.from('contacts')
				.select('id')
				.eq('homio_id', searchKey)
				.single()
			if (found?.id) {
				return found.id as string
			}
			
			// Inserir contato com homio_id real ou null se não temos o ID da Homio
			const { data: inserted, error: insertErr } = await supabaseAdmin
				.from('contacts')
				.insert({ 
					homio_id: c.homioId || null, // Salvar null se não temos o ID real da Homio
					name: c.name 
				})
				.select('id')
				.single()
			if (insertErr || !inserted) {
				throw insertErr || new Error('Failed to upsert contact')
			}
			return inserted.id as string
		}

		const primaryContactId = await upsertContact(primaryContact)
		const secondaryContactId = await upsertContact(secondaryContact ?? null)

		const { data: proposal, error: proposalErr } = await supabaseAdmin
			.from('proposals')
			.insert({
				opportunity_id: opportunityId,
				proposal_date: proposalDate,
				primary_contact_id: primaryContactId,
				secondary_contact_id: secondaryContactId,
				unit_id: resolvedUnitId,
				notes: null,
				responsible,
				name: proposalName ?? '',
				agency_id: agencyId,
				reserved_until: reservedUntil || null
			})
			.select('id')
			.single()

    if (proposalErr || !proposal) {
      return NextResponse.json({ 
        error: 'Failed to create proposal',
        supabase: {
          message: proposalErr?.message,
          details: proposalErr?.details,
          hint: proposalErr?.hint,
          code: proposalErr?.code
        }
      }, { status: 500 })
    }

		if (Array.isArray(installments) && installments.length > 0) {
			const payload = installments.map(i => ({
				type: i.type,
				amount_per_installment: i.amountPerInstallment,
				installments_count: i.installmentsCount,
				total_amount: i.totalAmount,
				start_date: i.startDate,
				proposal_id: proposal.id
			}))
			const { error: instErr } = await supabaseAdmin
				.from('installments')
				.insert(payload)
    if (instErr) {
      return NextResponse.json({ 
        error: 'Failed to insert installments',
        supabase: {
          message: instErr?.message,
          details: instErr?.details,
          hint: instErr?.hint,
          code: instErr?.code
        }
      }, { status: 500 })
    }
		}

		// Reservar unidade se reservedUntil estiver preenchido
		if (reservedUntil && resolvedUnitId) {
			const { error: unitUpdateErr } = await supabaseAdmin
				.from('units')
				.update({ 
					status: 'reserved',
					updated_at: new Date().toISOString()
				})
				.eq('id', resolvedUnitId)
				.eq('agency_id', agencyId)

		}
		return NextResponse.json({ id: proposal.id })
	} catch (error) {
		return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
	}
} 