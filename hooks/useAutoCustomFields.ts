import { useEffect, useRef } from 'react'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import { useCustomFieldsContext } from '@/lib/contexts/CustomFieldsContext'
import { dataService } from '@/lib/services/dataService'

export function useAutoCustomFields() {
  const { userData, loading: userLoading } = useUserDataContext()
  const { setCustomFieldIds, customFieldIds } = useCustomFieldsContext()
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const loadCustomFieldsAutomatically = async () => {
      // Evitar carregamento múltiplo
      if (!userData || userLoading || hasLoadedRef.current) return

      // Verificar se já tem custom fields carregados
      const hasOpportunityFields = Object.keys(customFieldIds.opportunityFields).length > 0
      const hasContactFields = Object.keys(customFieldIds.contactFields).length > 0
      
      if (hasOpportunityFields || hasContactFields) {
        return
      }

      hasLoadedRef.current = true

      try {
        // 1. Buscar configuração da agência
        const agencyConfig = await dataService.fetchAgencyConfigOnly(userData.activeLocation)
        
        if (!agencyConfig) {
          hasLoadedRef.current = false // Permitir nova tentativa
          return
        }

        // 2. Buscar custom field IDs baseado na configuração
        const customFieldIds = await dataService.fetchCustomFieldIdsForConfig(userData.activeLocation, agencyConfig)

        // 3. Atualizar contexto
        setCustomFieldIds(customFieldIds)

      } catch (error) {
        hasLoadedRef.current = false // Permitir nova tentativa em caso de erro
      }
    }

    loadCustomFieldsAutomatically()
  }, [userData?.activeLocation, userLoading]) // Removido setCustomFieldIds e customFieldIds das dependências
}
