import { getSupabase } from '@/lib/supabaseClient'

export interface OpportunityData {
  id: string
  name: string
  customFields: Record<string, string | number | boolean | null>
}

export interface ContactData {
  id: string
  name: string
  customFields: Record<string, string | number | boolean | null>
}

class OpportunityService {
  async fetchOpportunityWithCustomFields(opportunityId: string): Promise<{
    opportunity: OpportunityData | null
    contact: ContactData | null
  }> {
    try {
      console.log('🔍 Buscando oportunidade com custom fields:', opportunityId)
      
      const supabase = await getSupabase()
      
      // Buscar dados da oportunidade
      const { data: opportunity, error: oppError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single()

      if (oppError) {
        console.error('❌ Erro ao buscar oportunidade:', oppError)
        return { opportunity: null, contact: null }
      }

      // Buscar dados do contato relacionado
      let contact = null
      if (opportunity.contact_id) {
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', opportunity.contact_id)
          .single()

        if (!contactError && contactData) {
          contact = {
            id: contactData.id,
            name: contactData.name || '',
            customFields: contactData.custom_fields || {}
          }
        }
      }

      // Processar custom fields da oportunidade
      const opportunityCustomFields = opportunity.custom_fields || {}
      
      const opportunityData: OpportunityData = {
        id: opportunity.id,
        name: opportunity.name || '',
        customFields: opportunityCustomFields
      }

      console.log('✅ Dados da oportunidade carregados:', {
        opportunity: opportunityData,
        contact: contact
      })

      return {
        opportunity: opportunityData,
        contact: contact
      }

    } catch (error) {
      console.error('❌ Erro ao buscar oportunidade:', error)
      return { opportunity: null, contact: null }
    }
  }

  async mapCustomFieldsToForm(
    opportunityData: OpportunityData,
    contactData: ContactData | null,
    fieldMappings: {
      opportunityFields: Array<{ formField: string; customFieldId: string; customFieldName: string }>
      contactFields: Array<{ formField: string; customFieldId: string; customFieldName: string }>
    }
  ): Promise<{
    opportunityFormData: Record<string, string | number | boolean | null>
    contactFormData: Record<string, string | number | boolean | null>
  }> {
    console.log('🔄 Mapeando custom fields para formulário...')
    console.log('📊 Dados recebidos:')
    console.log('- Opportunity data:', opportunityData)
    console.log('- Contact data:', contactData)
    console.log('- Field mappings:', fieldMappings)
    
    const opportunityFormData: Record<string, string | number | boolean | null> = {}
    const contactFormData: Record<string, string | number | boolean | null> = {}

    // Mapear opportunity fields
    console.log('🔍 Mapeando opportunity fields...')
    fieldMappings.opportunityFields.forEach(mapping => {
      console.log(`🔍 Verificando mapping: ${mapping.formField} -> ${mapping.customFieldId}`)
      const customFieldValue = opportunityData.customFields[mapping.customFieldId]
      console.log(`🔍 Valor encontrado: ${customFieldValue}`)
      
      if (customFieldValue !== undefined && customFieldValue !== null) {
        opportunityFormData[mapping.formField] = customFieldValue
        console.log(`✅ Opportunity: ${mapping.formField} = ${customFieldValue}`)
      } else {
        console.log(`⚠️ Opportunity: ${mapping.formField} não encontrado ou vazio`)
      }
    })

    // Mapear contact fields
    if (contactData) {
      console.log('🔍 Mapeando contact fields...')
      fieldMappings.contactFields.forEach(mapping => {
        console.log(`🔍 Verificando mapping: ${mapping.formField} -> ${mapping.customFieldId}`)
        const customFieldValue = contactData.customFields[mapping.customFieldId]
        console.log(`🔍 Valor encontrado: ${customFieldValue}`)
        
        if (customFieldValue !== undefined && customFieldValue !== null) {
          contactFormData[mapping.formField] = customFieldValue
          console.log(`✅ Contact: ${mapping.formField} = ${customFieldValue}`)
        } else {
          console.log(`⚠️ Contact: ${mapping.formField} não encontrado ou vazio`)
        }
      })
    }

    console.log('🎯 Formulário mapeado:', {
      opportunityFormData,
      contactFormData
    })

    return {
      opportunityFormData,
      contactFormData
    }
  }
}

export const opportunityService = new OpportunityService()
