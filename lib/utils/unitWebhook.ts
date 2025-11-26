import { UnitStatus } from '@/lib/types/building'
import { getSupabase } from '@/lib/supabaseClient'
import { dataService } from '@/lib/services/dataService'

interface WebhookResponse {
  success: boolean
  message?: string
}

type WebhookEvent = 'statusChange' | 'amountChange' | 'correctionRateChange'

type WebhookStatus = 'Disponível' | 'Reservada' | 'Vendida'

interface WebhookPayload {
  id: string
  name: string
  buildingName: string
  event: WebhookEvent
  locationId: string
  table_url: string | null
  status?: WebhookStatus
  gross_price_amount?: number
  price_correction_rate?: number
}

function mapStatusToWebhookFormat(status: UnitStatus): WebhookStatus {
  const statusMap: Record<UnitStatus, WebhookStatus> = {
    'livre': 'Disponível',
    'reservado': 'Reservada',
    'vendido': 'Vendida'
  }
  return statusMap[status]
}

async function getAgencyInfo(agencyId: string): Promise<{ locationId: string; table_url: string | null }> {
  if (!agencyId) {
    return {
      locationId: agencyId,
      table_url: null,
    }
  }

  try {
    const agencyConfig = await dataService.fetchAgencyConfig(agencyId)
    const tableUrl = agencyConfig?.table_url || null
    return {
      locationId: agencyId,
      table_url: tableUrl,
    }
  } catch {
    return {
      locationId: agencyId,
      table_url: null,
    }
  }
}

async function sendUnitWebhook(
  unitId: string,
  unitName: string,
  buildingName: string,
  event: WebhookEvent,
  agencyId: string,
  data: { status?: UnitStatus; gross_price_amount?: number; price_correction_rate?: number }
): Promise<WebhookResponse> {
  try {
    const { locationId, table_url } = await getAgencyInfo(agencyId)

    const payload: WebhookPayload = {
      id: unitId,
      name: unitName,
      buildingName,
      event,
      locationId,
      table_url,
      ...(data.status ? { status: mapStatusToWebhookFormat(data.status) } : {}),
      ...(data.gross_price_amount !== undefined ? { gross_price_amount: data.gross_price_amount } : {}),
      ...(data.price_correction_rate !== undefined ? { price_correction_rate: data.price_correction_rate } : {}),
    }

    const response = await fetch('https://api.homio.com.br/webhook/unit/update-status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return {
        success: false,
        message: `Erro HTTP: ${response.status}`,
      }
    }

    const responseData = await response.json().catch(() => ({}))
    
    return {
      success: responseData.success === true,
      message: responseData.message,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar webhook',
    }
  }
}

export async function sendUnitStatusWebhook(
  unitId: string,
  unitName: string,
  status: UnitStatus,
  agencyId?: string,
  buildingName?: string
): Promise<WebhookResponse> {
  try {
    const supabase = await getSupabase()

    const { data: unitData } = await supabase
      .from('units')
      .select('agency_id, building_id, buildings(name)')
      .eq('id', unitId)
      .single()

    if (!unitData) {
      return {
        success: false,
        message: 'Unidade não encontrada',
      }
    }

    const finalAgencyId = agencyId || unitData.agency_id
    const finalBuildingName = buildingName || (unitData.buildings && typeof unitData.buildings === 'object' && 'name' in unitData.buildings ? unitData.buildings.name as string : undefined)

    if (!finalAgencyId) {
      return {
        success: false,
        message: 'Agency ID não encontrado',
      }
    }

    if (!finalBuildingName) {
      return {
        success: false,
        message: 'Nome do empreendimento não encontrado',
      }
    }

    return await sendUnitWebhook(unitId, unitName, finalBuildingName, 'statusChange', finalAgencyId, { status })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar webhook',
    }
  }
}

export async function sendUnitAmountWebhook(
  unitId: string,
  unitName: string,
  grossPriceAmount: number,
  agencyId?: string,
  buildingName?: string
): Promise<WebhookResponse> {
  try {
    let finalAgencyId: string | undefined = agencyId
    let finalBuildingName: string | undefined = buildingName

    const supabase = await getSupabase()

    if (!finalAgencyId || !finalBuildingName) {
      const { data: unitData } = await supabase
        .from('units')
        .select('agency_id, building_id, buildings(name)')
        .eq('id', unitId)
        .single()

      if (!unitData) {
        return {
          success: false,
          message: 'Unidade não encontrada',
        }
      }

      if (!finalAgencyId && unitData.agency_id) {
        finalAgencyId = unitData.agency_id
      }

      if (!finalBuildingName && unitData.buildings && typeof unitData.buildings === 'object' && 'name' in unitData.buildings) {
        finalBuildingName = unitData.buildings.name as string
      }
    }

    if (!finalAgencyId) {
      return {
        success: false,
        message: 'Agency ID não encontrado',
      }
    }

    if (!finalBuildingName) {
      return {
        success: false,
        message: 'Nome do empreendimento não encontrado',
      }
    }

    return await sendUnitWebhook(unitId, unitName, finalBuildingName, 'amountChange', finalAgencyId, { gross_price_amount: grossPriceAmount })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar webhook',
    }
  }
}

export async function sendUnitCorrectionRateWebhook(
  unitId: string,
  unitName: string,
  priceCorrectionRate: number,
  agencyId?: string,
  buildingName?: string
): Promise<WebhookResponse> {
  try {
    let finalAgencyId: string | undefined = agencyId
    let finalBuildingName: string | undefined = buildingName

    const supabase = await getSupabase()

    if (!finalAgencyId || !finalBuildingName) {
      const { data: unitData } = await supabase
        .from('units')
        .select('agency_id, building_id, buildings(name)')
        .eq('id', unitId)
        .single()

      if (!unitData) {
        return {
          success: false,
          message: 'Unidade não encontrada',
        }
      }

      if (!finalAgencyId && unitData.agency_id) {
        finalAgencyId = unitData.agency_id
      }

      if (!finalBuildingName && unitData.buildings && typeof unitData.buildings === 'object' && 'name' in unitData.buildings) {
        finalBuildingName = unitData.buildings.name as string
      }
    }

    if (!finalAgencyId) {
      return {
        success: false,
        message: 'Agency ID não encontrado',
      }
    }

    if (!finalBuildingName) {
      return {
        success: false,
        message: 'Nome do empreendimento não encontrado',
      }
    }

    return await sendUnitWebhook(unitId, unitName, finalBuildingName, 'correctionRateChange', finalAgencyId, { price_correction_rate: priceCorrectionRate })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar webhook',
    }
  }
}

