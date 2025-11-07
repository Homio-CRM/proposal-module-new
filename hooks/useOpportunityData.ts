import { useState, useCallback } from 'react'
import { useCustomFieldsContext } from '@/lib/contexts/CustomFieldsContext'
import { opportunityService } from '@/lib/services/opportunityService'

export function useOpportunityData() {
  const { getAllMappings } = useCustomFieldsContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOpportunityData = useCallback(async (opportunityId: string) => {
    try {
      setLoading(true)
      setError(null)


      // 1. Buscar dados da oportunidade
      const { opportunity, contact } = await opportunityService.fetchOpportunityWithCustomFields(opportunityId)

      if (!opportunity) {
        throw new Error('Oportunidade não encontrada')
      }

      // 2. Obter mapeamentos dos custom fields
      const fieldMappings = getAllMappings()

      // 3. Mapear custom fields para formulário
      const { opportunityFormData, contactFormData } = await opportunityService.mapCustomFieldsToForm(
        opportunity,
        contact,
        fieldMappings
      )

      return {
        opportunity,
        contact,
        opportunityFormData,
        contactFormData
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('❌ Erro ao carregar oportunidade:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getAllMappings])

  return {
    loadOpportunityData,
    loading,
    error
  }
}
