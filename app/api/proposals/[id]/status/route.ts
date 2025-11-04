import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ProposalStatus } from '@/lib/types/proposal'

const supabaseUrl = process.env.SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(
	supabaseUrl,
	serviceRoleKey,
	{ auth: {} }
)

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const proposalId = id
		const body = await req.json()
		const { status, updateUnitStatus, reservedUntil } = body as { 
			status: string
			updateUnitStatus?: boolean
			reservedUntil?: string | null
		}

		const shouldUpdateUnit = Boolean(updateUnitStatus)

		if (!status) {
			return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 })
		}

		const statusMap: Record<string, 'denied' | 'under_review' | 'approved'> = {
			'em_analise': 'under_review',
			'aprovada': 'approved',
			'negada': 'denied'
		}

		const validStatuses = ['em_analise', 'aprovada', 'negada']
		if (!validStatuses.includes(status)) {
			return NextResponse.json({ 
				error: 'Status inválido',
				validStatuses 
			}, { status: 400 })
		}

		const dbStatus = statusMap[status]

		const { data: existingProposal, error: checkError } = await supabaseAdmin
			.from('proposals')
			.select('id, unit_id, agency_id')
			.eq('id', proposalId)
			.single()

		if (checkError) {
			return NextResponse.json({ 
				error: 'Erro ao verificar proposta',
				supabase: {
					message: checkError.message,
					details: checkError.details,
					hint: checkError.hint,
					code: checkError.code
				}
			}, { status: 500 })
		}

		if (!existingProposal) {
			return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
		}

		const { data, error } = await supabaseAdmin
			.from('proposals')
			.update({ status: dbStatus })
			.eq('id', proposalId)
			.select('id, status')
			.single()

		if (error) {
			return NextResponse.json({ 
				error: 'Erro ao atualizar status',
				supabase: {
					message: error.message,
					details: error.details,
					hint: error.hint,
					code: error.code
				},
				debug: {
					proposalId,
					status,
					validStatuses
				}
			}, { status: 500 })
		}

		if (!data) {
			return NextResponse.json({ error: 'Proposta não encontrada após atualização' }, { status: 404 })
		}

		if (shouldUpdateUnit && existingProposal.unit_id) {
			let unitStatus: 'sold' | 'available' | 'reserved' | null = null

			if (status === 'aprovada') {
				unitStatus = 'sold'
			} else if (status === 'negada') {
				unitStatus = 'available'
			} else if (status === 'em_analise' && reservedUntil) {
				unitStatus = 'reserved'
			}

			if (unitStatus) {
				const updateData: { status: string; updated_at: string } = {
					status: unitStatus,
					updated_at: new Date().toISOString()
				}

				const { data: updatedUnit, error: unitUpdateError } = await supabaseAdmin
					.from('units')
					.update(updateData)
					.eq('id', existingProposal.unit_id)
					.eq('agency_id', existingProposal.agency_id)
					.select('id, status')
					.single()

				if (unitUpdateError) {
					console.error('[PATCH /api/proposals/[id]/status] Erro ao atualizar unidade:', unitUpdateError)
					return NextResponse.json({ 
						error: 'Status da proposta atualizado, mas houve erro ao atualizar status da unidade',
						supabase: {
							message: unitUpdateError.message,
							details: unitUpdateError.details,
							hint: unitUpdateError.hint,
							code: unitUpdateError.code
						},
						debug: {
							unitId: existingProposal.unit_id,
							agencyId: existingProposal.agency_id,
							unitStatus,
							updateUnitStatus
						}
					}, { status: 500 })
				}

				if (!updatedUnit) {
					console.error('[PATCH /api/proposals/[id]/status] Unidade não encontrada após atualização')
				}
			}
		}

		if (reservedUntil && shouldUpdateUnit) {
			const { error: proposalUpdateError } = await supabaseAdmin
				.from('proposals')
				.update({ reserved_until: reservedUntil })
				.eq('id', proposalId)

			if (proposalUpdateError) {
				console.error('[PATCH /api/proposals/[id]/status] Erro ao atualizar reserved_until:', proposalUpdateError)
			}
		} else if (!reservedUntil && shouldUpdateUnit && status === 'em_analise') {
			const { error: proposalUpdateError } = await supabaseAdmin
				.from('proposals')
				.update({ reserved_until: null })
				.eq('id', proposalId)

			if (proposalUpdateError) {
				console.error('[PATCH /api/proposals/[id]/status] Erro ao limpar reserved_until:', proposalUpdateError)
			}
		}

		const reverseStatusMap: Record<string, ProposalStatus> = {
			'under_review': 'em_analise',
			'approved': 'aprovada',
			'denied': 'negada'
		}

		const frontendStatus = reverseStatusMap[data.status] || 'em_analise'

		return NextResponse.json({ id: data.id, status: frontendStatus })
	} catch (error) {
		console.error('[PATCH /api/proposals/[id]/status] Erro:', error)
		return NextResponse.json({ 
			error: error instanceof Error ? error.message : 'Erro desconhecido',
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 })
	}
}
