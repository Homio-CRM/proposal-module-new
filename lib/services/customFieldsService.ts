interface CustomField {
  id: string
  name: string
  fieldKey: string
  model: string
  type: string
  required: boolean
  options?: string[]
}

interface CustomFieldsResponse {
  customFields: CustomField[]
}


class CustomFieldsService {
  async fetchCustomFields(locationId: string, model: 'opportunity' | 'contact'): Promise<CustomField[]> {
    try {
      
      const response = await fetch('/api/operations/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'locationId': locationId
        },
        body: JSON.stringify({ model })
      })

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`)
      }

      const data: CustomFieldsResponse = await response.json()

      if (!data.customFields || !Array.isArray(data.customFields)) {
        return []
      }

      // Filtrar apenas os custom fields do modelo específico
      const filteredFields = data.customFields.filter((field: CustomField) => field.model === model)

      return filteredFields
    } catch (error: unknown) {
      console.error(`❌ Erro ao buscar custom fields para ${model}:`, error)
      return []
    }
  }

  async findCustomFieldIds(
    locationId: string, 
    opportunityKeys: string[], 
    contactKeys: string[]
  ): Promise<{
    opportunityFields: Record<string, string>
    contactFields: Record<string, string>
  }> {
    try {
      // Buscar custom fields para opportunity e contact em paralelo
      const [opportunityFields, contactFields] = await Promise.all([
        this.fetchCustomFields(locationId, 'opportunity'),
        this.fetchCustomFields(locationId, 'contact')
      ])

      // Mapear keys para IDs
      const opportunityFieldIds: Record<string, string> = {}
      const contactFieldIds: Record<string, string> = {}

      // Mapeamento de keys para nomes de campos do formulário (usando key WITHOUT prefix)
      const opportunityFieldMapping: Record<string, string> = {
        'building': 'empreendimento',
        'unit': 'unidade',
        'empreendimento': 'empreendimento',
        'unidade': 'unidade', 
        'andar': 'andar',
        'torre': 'torre',
        'responsible': 'responsavel',
        'opportunityresponsavel': 'responsavel',
        'observations': 'observacoes',
        'observacoes': 'observacoes',
        'observaes': 'observacoes',
        'reserve_until': 'reserve_until',
        'reservar_at': 'reserve_until',
        'reserveUntil': 'reserve_until'
      }

      const contactFieldMapping: Record<string, string> = {
        'cpf': 'cpf',
        'rg': 'rg',
        'rg__orgao_emissor': 'orgaoEmissor',
        'orgaoEmissor': 'orgaoEmissor',
        'nacionalidade': 'nacionalidade',
        'estado_civil': 'estadoCivil',
        'civil': 'estadoCivil',
        'profisso': 'profissao',
        'profissao': 'profissao',
        'cep': 'cep',
        'endereco': 'endereco',
        'cidade': 'cidade',
        'bairro': 'bairro',
        'estado': 'estado',
        'unidade_do_empreendimento': 'unidade',
        'pavimento': 'andar',
        'torre': 'torre',
        'empreendimento': 'empreendimento'
      }

      // Processar opportunity fields
      opportunityKeys.forEach((key: string) => {
        if (key && key.trim()) {
          console.log(`🔍 [CustomFieldsService] Processando opportunity key: "${key}"`)
          
          // Remover prefixo opportunity_ se existir
          const keyWithoutPrefix = key.replace(/^opportunity_/, '')
          console.log(`🔍 [CustomFieldsService] Key sem prefixo: "${keyWithoutPrefix}"`)
          
          // Primeiro tentar com o fieldKey exato
          let fieldKey = `opportunity.${keyWithoutPrefix}`
          console.log(`🔍 [CustomFieldsService] Buscando fieldKey: "${fieldKey}"`)
          
          let field = opportunityFields.find((f: CustomField) => f.fieldKey === fieldKey)
          
          // Se não encontrou, tentar variações comuns
          if (!field) {
            // Para reserve_until, tentar reservar_at
            if (keyWithoutPrefix === 'reserve_until') {
              fieldKey = 'opportunity.reservar_at'
              console.log(`🔍 [CustomFieldsService] Tentando fieldKey alternativo: "${fieldKey}"`)
              field = opportunityFields.find((f: CustomField) => f.fieldKey === fieldKey)
            }
            // Para responsible, tentar opportunityresponsavel
            if (keyWithoutPrefix === 'responsible') {
              fieldKey = 'opportunity.opportunityresponsavel'
              console.log(`🔍 [CustomFieldsService] Tentando fieldKey alternativo: "${fieldKey}"`)
              field = opportunityFields.find((f: CustomField) => f.fieldKey === fieldKey)
            }
            // Para observations, tentar observaes
            if (keyWithoutPrefix === 'observations') {
              fieldKey = 'opportunity.observaes'
              console.log(`🔍 [CustomFieldsService] Tentando fieldKey alternativo: "${fieldKey}"`)
              field = opportunityFields.find((f: CustomField) => f.fieldKey === fieldKey)
            }
          }
          
          console.log(`🔍 [CustomFieldsService] Campo encontrado:`, field)
          
          if (field) {
            const formFieldName = opportunityFieldMapping[keyWithoutPrefix] || 
              opportunityFieldMapping[field.fieldKey.replace('opportunity.', '')] || 
              keyWithoutPrefix
            console.log(`🔍 [CustomFieldsService] FormFieldName final: "${formFieldName}"`)
            opportunityFieldIds[formFieldName] = field.id
          } else {
            console.log(`⚠️ [CustomFieldsService] Campo não encontrado para key: "${key}"`)
          }
        }
      })

      // Processar contact fields
      contactKeys.forEach((key: string) => {
        if (key && key.trim()) {
          console.log(`🔍 [CustomFieldsService] Processando contact key: "${key}"`)
          
          // Remover prefixo contact_ se existir
          const keyWithoutPrefix = key.replace(/^contact_/, '')
          console.log(`🔍 [CustomFieldsService] Key sem prefixo: "${keyWithoutPrefix}"`)
          
          // Procurar por fieldKey que corresponde a contact.[key]
          const fieldKey = `contact.${keyWithoutPrefix}`
          console.log(`🔍 [CustomFieldsService] Buscando fieldKey: "${fieldKey}"`)
          
          const field = contactFields.find((f: CustomField) => f.fieldKey === fieldKey)
          console.log(`🔍 [CustomFieldsService] Campo encontrado:`, field)
          
          if (field) {
            const formFieldName = contactFieldMapping[keyWithoutPrefix] || keyWithoutPrefix
            console.log(`🔍 [CustomFieldsService] FormFieldName: "${formFieldName}"`)
            contactFieldIds[formFieldName] = field.id
          } else {
            console.log(`⚠️ [CustomFieldsService] Campo não encontrado para key: "${key}"`)
          }
        }
      })

      console.log('🔍 [CustomFieldsService] opportunityFieldIds final:', opportunityFieldIds)
      console.log('🔍 [CustomFieldsService] contactFieldIds final:', contactFieldIds)
      
      // Log todas as opportunity fields disponíveis para debug
      console.log('🔍 [CustomFieldsService] Campos opportunity disponíveis:')
      opportunityFields.forEach(f => {
        console.log(`  - fieldKey: ${f.fieldKey}, name: ${f.name}, id: ${f.id}`)
      })

      return {
        opportunityFields: opportunityFieldIds,
        contactFields: contactFieldIds
      }
    } catch (error: unknown) {
      console.error('❌ Erro ao buscar IDs dos custom fields:', error)
      return {
        opportunityFields: {},
        contactFields: {}
      }
    }
  }
}

export const customFieldsService = new CustomFieldsService()
