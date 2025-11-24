interface FinanceWebhookPayload {
  installments: Array<{
    id: string
    condition: string
    value: number
    quantity: number
    date: string
    totalAmount?: number
  }>
  mainContactId: string
  locationId: string
}

interface WebhookResponse {
  success: boolean
  message?: string
}

export async function sendFinancePartWebhook(
  installments: FinanceWebhookPayload['installments'],
  mainContactId: string,
  locationId: string
): Promise<WebhookResponse> {
  try {
    const payload: FinanceWebhookPayload = {
      installments,
      mainContactId,
      locationId
    }

    const response = await fetch('https://api.homio.com.br/webhook/mivita/finance-part', {
      method: 'POST',
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

    const data = await response.json().catch(() => ({}))
    
    return {
      success: data.success === true || response.ok,
      message: data.message,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar webhook',
    }
  }
}

