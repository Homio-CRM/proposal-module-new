import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPreferencesByLocationId } from '@/app/api/utils/preferences'
import { getUserRoleById } from '@/app/api/utils/user'
import { canManageProposals as canManageProposalsPermission, restrictProposalsToCreator } from '@/lib/utils/permissions'
import type { UserRole } from '@/lib/types'

const supabaseUrl = process.env.SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const anonKey = process.env.SUPABASE_ANON_KEY || ''

const supabaseAdmin = createClient(
	supabaseUrl,
	serviceRoleKey,
	{ auth: {} }
)

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const authHeader = req.headers.get('authorization')
		let userRole: UserRole = 'user'
		let requestUserId: string | null = null

		if (authHeader && anonKey) {
			const token = authHeader.replace('Bearer ', '')
			const supabaseClient = createClient(supabaseUrl, anonKey)
			const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
			if (!userError && user) {
				requestUserId = user.id
				userRole = await getUserRoleById(supabaseAdmin, user.id)
			}
		}

		if (!requestUserId) {
			return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
		}

		const { id } = await params
		const proposalId = id
		const body = await req.json()
		const {
			opportunityId,
			proposalDate,
			proposalName,
			responsible,
			reservedUntil,
			shouldReserveUnit,
			unitId,
			primaryContact,
			secondaryContact,
			installments
		} = body as {
			opportunityId: string
			proposalDate: string
			proposalName?: string
			responsible: string
			reservedUntil?: string
			shouldReserveUnit?: boolean
			unitId?: string
			primaryContact: { homioId?: string; name: string }
			secondaryContact?: { homioId?: string; name: string } | null
			installments: Array<{ 
				id?: string
				type: string
				amountPerInstallment: number
				installmentsCount: number
				totalAmount: number
				startDate: string
			}>
		}

		const missing: string[] = []
		if (!opportunityId) missing.push('opportunityId')
		if (!proposalDate) missing.push('proposalDate')
		if (!responsible) missing.push('responsible')
		if (!unitId) missing.push('unitId')
		if (!primaryContact?.name) missing.push('primaryContact.name')
		if (missing.length) {
			return NextResponse.json({ error: 'Campos obrigatórios faltando', missing }, { status: 400 })
		}

		const { data: proposalCheck } = await supabaseAdmin
			.from('proposals')
			.select('agency_id, created_by')
			.eq('id', proposalId)
			.single()

		if (!proposalCheck) {
			return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
		}

		const preferences = await getPreferencesByLocationId(supabaseAdmin, proposalCheck.agency_id)
		if (!canManageProposalsPermission(preferences, userRole)) {
			return NextResponse.json({ error: 'Sem permissão para atualizar propostas' }, { status: 403 })
		}

		if (restrictProposalsToCreator(preferences, userRole) && proposalCheck.created_by && proposalCheck.created_by !== requestUserId) {
			return NextResponse.json({ error: 'Sem permissão para editar esta proposta' }, { status: 403 })
		}

		const { data: verifyUnit } = await supabaseAdmin
			.from('units')
			.select('id, agency_id')
			.eq('id', unitId)
			.eq('agency_id', proposalCheck.agency_id)
			.single()

		if (!verifyUnit) {
			return NextResponse.json({ error: 'Unidade não encontrada ou não pertence à agência', unitId }, { status: 404 })
		}

		const updateContact = async (c?: { homioId?: string; name: string } | null) => {
			if (!c || !c.name) return null as string | null
			
			const { data: found } = await supabaseAdmin
				.from('contacts')
				.select('id')
				.eq('homio_id', c.homioId || c.name)
				.single()
			
			if (found?.id) {
				await supabaseAdmin
					.from('contacts')
					.update({ name: c.name })
					.eq('id', found.id)
				return found.id as string
			}
			
			const { data: inserted, error: insertErr } = await supabaseAdmin
				.from('contacts')
				.insert({ 
					homio_id: c.homioId || null,
					name: c.name 
				})
				.select('id')
				.single()
			
			if (insertErr || !inserted) {
				throw insertErr || new Error('Failed to update contact')
			}
			return inserted.id as string
		}

		const primaryContactId = await updateContact(primaryContact)
		const secondaryContactId = await updateContact(secondaryContact ?? null)

		const { data: proposal, error: proposalErr } = await supabaseAdmin
			.from('proposals')
			.update({
				opportunity_id: opportunityId,
				proposal_date: proposalDate,
				primary_contact_id: primaryContactId,
				secondary_contact_id: secondaryContactId,
				unit_id: unitId,
				notes: null,
				responsible,
				name: proposalName ?? '',
				reserved_until: reservedUntil || null
			})
			.eq('id', proposalId)
			.select('id')
			.single()

		if (proposalErr || !proposal) {
			return NextResponse.json({ 
				error: 'Erro ao atualizar proposta',
				supabase: {
					message: proposalErr?.message,
					details: proposalErr?.details,
					hint: proposalErr?.hint,
					code: proposalErr?.code
				}
			}, { status: 500 })
		}

		if (Array.isArray(installments) && installments.length > 0) {
			const { error: deleteErr } = await supabaseAdmin
				.from('installments')
				.delete()
				.eq('proposal_id', proposalId)

			if (deleteErr) {
				return NextResponse.json({ 
					error: 'Erro ao deletar parcelas antigas',
					supabase: { message: deleteErr.message }
				}, { status: 500 })
			}

			const payload = installments.map(i => ({
				type: i.type,
				amount_per_installment: i.amountPerInstallment,
				installments_count: i.installmentsCount,
				total_amount: i.totalAmount,
				start_date: i.startDate,
				proposal_id: proposalId
			}))

			const { error: instErr } = await supabaseAdmin
				.from('installments')
				.insert(payload)

			if (instErr) {
				return NextResponse.json({ 
					error: 'Erro ao inserir parcelas',
					supabase: {
						message: instErr?.message,
						details: instErr?.details,
						hint: instErr?.hint,
						code: instErr?.code
					}
				}, { status: 500 })
			}
		}

		if (shouldReserveUnit !== false && reservedUntil && unitId) {
			await supabaseAdmin
				.from('units')
				.update({ 
					status: 'reserved',
					updated_at: new Date().toISOString()
				})
				.eq('id', unitId)
		}

		return NextResponse.json({ id: proposal.id })
	} catch (error) {
		return NextResponse.json({ 
			error: error instanceof Error ? error.message : 'Erro desconhecido' 
		}, { status: 500 })
	}
}

