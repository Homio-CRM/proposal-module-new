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
        'parking_spots': 'vagas',
        'parkingSpots': 'vagas',
        'vagas': 'vagas',
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
        'estado': 'estado'
      }

      // Processar opportunity fields
      opportunityKeys.forEach((key: string) => {
        if (key && key.trim()) {
          
          // Remover prefixo opportunity_ se existir
          const keyWithoutPrefix = key.replace(/^opportunity_/, '')
          const keyTrimmed = key.trim()
          
          // Primeiro tentar com o fieldKey exato
          let fieldKey = `opportunity.${keyWithoutPrefix}`
          
          let field = opportunityFields.find((f: CustomField) => f.fieldKey === fieldKey)
          
          // Se não encontrou, tentar variações comuns
          if (!field) {
            // Para reserve_until, tentar reservar_at
            if (keyWithoutPrefix === 'reserve_until') {
              fieldKey = 'opportunity.reservar_at'
              field = opportunityFields.find((f: CustomField) => f.fieldKey === fieldKey)
            }
            // Para responsible, tentar opportunityresponsavel
            if (keyWithoutPrefix === 'responsible') {
              fieldKey = 'opportunity.opportunityresponsavel'
              field = opportunityFields.find((f: CustomField) => f.fieldKey === fieldKey)
            }
            // Para observations, tentar observaes
            if (keyWithoutPrefix === 'observations') {
              fieldKey = 'opportunity.observaes'
              field = opportunityFields.find((f: CustomField) => f.fieldKey === fieldKey)
            }
          }
          
          // Se ainda não encontrou, tentar buscar pelo nome do campo (case insensitive)
          if (!field) {
            // Primeiro tentar match exato
            field = opportunityFields.find((f: CustomField) => 
              f.name.toLowerCase().trim() === keyTrimmed.toLowerCase()
            )
            
            // Se não encontrou, tentar match parcial (o nome do campo contém o texto digitado ou vice-versa)
            if (!field) {
              field = opportunityFields.find((f: CustomField) => {
                const fieldNameLower = f.name.toLowerCase().trim()
                const keyLower = keyTrimmed.toLowerCase()
                return fieldNameLower.includes(keyLower) || keyLower.includes(fieldNameLower)
              })
            }
          }
          
          // Se ainda não encontrou, tentar buscar pelo fieldKey sem o prefixo opportunity
          if (!field) {
            field = opportunityFields.find((f: CustomField) => {
              const fieldKeyWithoutPrefix = f.fieldKey.replace(/^opportunity\./, '')
              return fieldKeyWithoutPrefix.toLowerCase().trim() === keyTrimmed.toLowerCase()
            })
          }
          
          if (field) {
            // Determinar o nome do campo do formulário baseado no mapeamento ou no fieldKey
            let formFieldName = opportunityFieldMapping[keyWithoutPrefix]
            
            if (!formFieldName && field.fieldKey) {
              const fieldKeyWithoutPrefix = field.fieldKey.replace(/^opportunity\./, '')
              formFieldName = opportunityFieldMapping[fieldKeyWithoutPrefix]
            }
            
            if (!formFieldName) {
              // Tentar inferir pelo nome do campo
              const fieldNameLower = field.name.toLowerCase()
              const keyLower = keyTrimmed.toLowerCase()
              
              if (fieldNameLower.includes('andar') || fieldNameLower.includes('pavimento') || fieldNameLower.includes('floor') ||
                  keyLower.includes('andar') || keyLower.includes('pavimento') || keyLower.includes('floor')) {
                formFieldName = 'andar'
              } else if (fieldNameLower.includes('vagas') || fieldNameLower.includes('parking') || fieldNameLower.includes('estacionamento') ||
                         keyLower.includes('vagas') || keyLower.includes('parking') || keyLower.includes('estacionamento')) {
                formFieldName = 'vagas'
              } else if (fieldNameLower.includes('torre') || fieldNameLower.includes('tower') ||
                         keyLower.includes('torre') || keyLower.includes('tower')) {
                formFieldName = 'torre'
              } else {
                formFieldName = keyWithoutPrefix
              }
            }
            
            opportunityFieldIds[formFieldName] = field.id
          }
        }
      })

      // Processar contact fields
      contactKeys.forEach((key: string) => {
        if (key && key.trim()) {
          
          // Remover prefixo contact_ se existir
          const keyWithoutPrefix = key.replace(/^contact_/, '')
          
          // Procurar por fieldKey que corresponde a contact.[key]
          const fieldKey = `contact.${keyWithoutPrefix}`
          
          const field = contactFields.find((f: CustomField) => f.fieldKey === fieldKey)
          
          if (field) {
            const formFieldName = contactFieldMapping[keyWithoutPrefix] || keyWithoutPrefix
            contactFieldIds[formFieldName] = field.id
          } else {
          }
        }
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
