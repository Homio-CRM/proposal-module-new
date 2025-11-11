import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ProposalStatus } from '@/lib/types/proposal'
import { sendUnitStatusWebhook } from '@/lib/utils/unitWebhook'
import { mapStatusFromDB } from '@/lib/services/buildingService'
import { postToOperations } from '@/lib/operationsClient'
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

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const proposalId = id
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
			.select('id, unit_id, agency_id, created_by')
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

		const preferences = await getPreferencesByLocationId(supabaseAdmin, existingProposal.agency_id)
		if (!canManageProposalsPermission(preferences, userRole)) {
			return NextResponse.json({ error: 'Sem permissão para atualizar propostas' }, { status: 403 })
		}

		if (restrictProposalsToCreator(preferences, userRole) && existingProposal.created_by && existingProposal.created_by !== requestUserId) {
			return NextResponse.json({ error: 'Sem permissão para alterar esta proposta' }, { status: 403 })
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
					.select('id, name, status')
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
				} else {
					const frontendStatus = mapStatusFromDB(updatedUnit.status as 'available' | 'reserved' | 'sold')
					const webhookResult = await sendUnitStatusWebhook(
						updatedUnit.id,
						updatedUnit.name,
						frontendStatus
					)

					if (!webhookResult.success) {
						return NextResponse.json({
							error: 'WEBHOOK_ERROR',
							webhookError: true,
							webhookMessage: webhookResult.message || 'Erro ao enviar webhook de atualização de status da unidade',
							message: 'Ocorreu um erro ao atualizar o status da unidade. Por favor, entre em contato com os desenvolvedores.'
						}, { status: 500 })
					}
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

		if (status === 'em_analise') {
			try {
				const { data: proposalDetails } = await supabaseAdmin
					.from('proposals')
					.select(`
						opportunity_id,
						responsible,
						reserved_until,
						notes,
						unit:units(
							name,
							number,
							tower,
							floor,
							buildings(name)
						)
					`)
					.eq('id', proposalId)
					.single()

				if (proposalDetails?.opportunity_id) {
					const { data: agencyConfig } = await supabaseAdmin
						.from('agency_config')
						.select('opportunity_building, opportunity_unit, opportunity_responsible, opportunity_observations, opportunity_reserve_until')
						.eq('location_id', existingProposal.agency_id)
						.single()

					if (agencyConfig) {
						const customFields: Array<{ id: string; field_value: string }> = []
						const pushField = (id?: string | null, value?: string | null) => {
							if (id && value && value.trim() !== '') {
								customFields.push({ id, field_value: value.trim() })
							}
						}

					const unitValue = proposalDetails?.unit
					const unitData = Array.isArray(unitValue) ? unitValue[0] : unitValue
					const buildingValue = unitData?.buildings
					const buildingData = Array.isArray(buildingValue) ? buildingValue[0] : buildingValue
					const buildingName = buildingData?.name || ''
					const unitLabel = unitData?.name || unitData?.number || ''
						const responsibleValue = proposalDetails.responsible || ''
						const observationsValue = proposalDetails.notes || ''
						const reservedValue = (reservedUntil ?? proposalDetails.reserved_until ?? '') || ''

						pushField(agencyConfig.opportunity_building, buildingName)
						pushField(agencyConfig.opportunity_unit, unitLabel)
						pushField(agencyConfig.opportunity_responsible, responsibleValue)
						pushField(agencyConfig.opportunity_observations, observationsValue)
						pushField(agencyConfig.opportunity_reserve_until, reservedValue)

						const apiKey = process.env.SUPABASE_OPERATIONS_ANON_KEY || ''
					const headers: Record<string, string> | undefined = apiKey ? { apikey: apiKey } : undefined

						await postToOperations(
							'ghl-update-opportunity',
							{
								opportunityId: proposalDetails.opportunity_id,
								customFields
							},
							headers,
							existingProposal.agency_id
						)
					}
				}
			} catch (error) {
				console.error('[PATCH /api/proposals/[id]/status] Erro ao enviar atualização da oportunidade:', error)
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
