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
        'observations': 'observacoes',
        'observacoes': 'observacoes',
        'reserve_until': 'reserve_until',
        'reservar_at': 'reserve_until',
        'reserveUntil': 'reserve_until'
      }

      const contactFieldMapping: Record<string, string> = {
        'cpf': 'cpf',
        'rg': 'rg',
        'orgaoEmissor': 'orgaoEmissor',
        'nacionalidade': 'nacionalidade',
        'civil': 'estadoCivil',
        'profisso': 'profissao',
        'cep': 'cep',
        'endereco': 'endereco',
        'cidade': 'cidade',
        'bairro': 'bairro',
        'estado': 'estado'
      }

      // Processar opportunity fields
      opportunityKeys.forEach((key: string) => {
        if (key && key.trim()) {
          console.log(`🔍 [CustomFieldsService] Processando opportunity key: "${key}"`)
          
          // Remover prefixo opportunity_ se existir
          const keyWithoutPrefix = key.replace(/^opportunity_/, '')
          console.log(`🔍 [CustomFieldsService] Key sem prefixo: "${keyWithoutPrefix}"`)
          
          // Procurar por fieldKey que corresponde a opportunity.[key]
          const fieldKey = `opportunity.${keyWithoutPrefix}`
          console.log(`🔍 [CustomFieldsService] Buscando fieldKey: "${fieldKey}"`)
          
          const field = opportunityFields.find((f: CustomField) => f.fieldKey === fieldKey)
          console.log(`🔍 [CustomFieldsService] Campo encontrado:`, field)
          
          if (field) {
            const formFieldName = opportunityFieldMapping[keyWithoutPrefix] || keyWithoutPrefix
            console.log(`🔍 [CustomFieldsService] FormFieldName: "${formFieldName}"`)
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
