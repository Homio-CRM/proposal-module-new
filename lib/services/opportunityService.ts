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
      
      const supabase = await getSupabase()
      
      // Buscar dados da oportunidade
      const { data: opportunity, error: oppError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single()

      if (oppError) {
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

      return {
        opportunity: opportunityData,
        contact: contact
      }

    } catch {
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
    
    const opportunityFormData: Record<string, string | number | boolean | null> = {}
    const contactFormData: Record<string, string | number | boolean | null> = {}

    // Mapear opportunity fields
    fieldMappings.opportunityFields.forEach(mapping => {
      const customFieldValue = opportunityData.customFields[mapping.customFieldId]
      
      if (customFieldValue !== undefined && customFieldValue !== null) {
        opportunityFormData[mapping.formField] = customFieldValue
      }
    })

    // Mapear contact fields
    if (contactData) {
      fieldMappings.contactFields.forEach(mapping => {
        const customFieldValue = contactData.customFields[mapping.customFieldId]
        
        if (customFieldValue !== undefined && customFieldValue !== null) {
          contactFormData[mapping.formField] = customFieldValue
        }
      })
    }

    return {
      opportunityFormData,
      contactFormData
    }
  }
}

export const opportunityService = new OpportunityService()
