interface FinanceWebhookPayload {
  installments: Array<{
    id: string
    condition: string
    value: number
    quantity: number
    date: string
    dates?: string[]
    totalAmount?: number
  }>
  opportunityId: string
  locationId: string
}

interface WebhookResponse {
  success: boolean
  message?: string
  warning?: string | null
  empreendimento?: string | null
  empreendimentoMapeado?: boolean
}

export async function sendFinancePartWebhook(
  installments: FinanceWebhookPayload['installments'],
  opportunityId: string,
  locationId: string
): Promise<WebhookResponse> {
  try {
    const payload: FinanceWebhookPayload = {
      installments,
      opportunityId,
      locationId
    }

    const baseUrl = process.env.SUPABASE_OPERATIONS_URL || ''
    const anonKey = process.env.SUPABASE_OPERATIONS_ANON_KEY || ''
    const url = `${baseUrl.replace(/\/$/, '')}/mivita-finance-part`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({} as Record<string, unknown>))

    if (!response.ok || data.ok === false) {
      return {
        success: false,
        message: (data.error as string) || (data.message as string) || `Erro HTTP: ${response.status}`,
      }
    }

    return {
      success: true,
      message: data.message as string | undefined,
      warning: (data.warning as string | null) ?? null,
      empreendimento: (data.empreendimento as string | null) ?? null,
      empreendimentoMapeado: (data.empreendimento_mapeado as boolean) ?? undefined,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao enviar webhook',
    }
  }
}

