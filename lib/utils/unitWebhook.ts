import { UnitStatus } from '@/lib/types/building'

interface WebhookResponse {
  success: boolean
  message?: string
}

export async function sendUnitStatusWebhook(
  unitId: string,
  unitName: string,
  status: UnitStatus
): Promise<WebhookResponse> {
  try {
    const response = await fetch('https://api.homio.com.br/webhook/unit/update-status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: unitId,
        name: unitName,
        status: status,
      }),
    })

    if (!response.ok) {
      return {
        success: false,
        message: `Erro HTTP: ${response.status}`,
      }
    }

    const data = await response.json().catch(() => ({}))
    
    return {
      success: data.success === true,
      message: data.message,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar webhook',
    }
  }
}

