interface CustomField {
  id: string
  name: string
  fieldKey: string
  model: string
  type: string
  required: boolean
  options?: string[]
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

      const data = await response.json()

      if (!data.customFields || !Array.isArray(data.customFields)) {
        return []
      }

      // Filtrar apenas os custom fields do modelo específico
      const filteredFields = data.customFields.filter(field => field.model === model)

      return filteredFields
    } catch (error) {
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

      // Mapeamento de keys para nomes de campos do formulário
      const opportunityFieldMapping: Record<string, string> = {
        'empreendimento': 'empreendimento',
        'unidade': 'unidade', 
        'andar': 'andar',
        'torre': 'torre',
        'opportunityresponsavel': 'responsavel',
        'observacoes': 'observacoes'
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
      opportunityKeys.forEach(key => {
        if (key && key.trim()) {
          // Procurar por fieldKey que corresponde a opportunity.[key]
          const fieldKey = `opportunity.${key}`
          const field = opportunityFields.find(f => f.fieldKey === fieldKey)
          if (field) {
            const formFieldName = opportunityFieldMapping[key] || key
            opportunityFieldIds[formFieldName] = field.id
          }
        }
      })

      // Processar contact fields
      contactKeys.forEach(key => {
        if (key && key.trim()) {
          // Procurar por fieldKey que corresponde a contact.[key]
          const fieldKey = `contact.${key}`
          const field = contactFields.find(f => f.fieldKey === fieldKey)
          if (field) {
            const formFieldName = contactFieldMapping[key] || key
            contactFieldIds[formFieldName] = field.id
          }
        }
      })

      return {
        opportunityFields: opportunityFieldIds,
        contactFields: contactFieldIds
      }
    } catch (error) {
      console.error('❌ Erro ao buscar IDs dos custom fields:', error)
      return {
        opportunityFields: {},
        contactFields: {}
      }
    }
  }
}

export const customFieldsService = new CustomFieldsService()
