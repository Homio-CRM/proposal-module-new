import { getSupabase } from '@/lib/supabaseClient'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { customFieldsService } from './customFieldsService'
import type { ProposalListItem } from '@/lib/types/proposal'

export interface AgencyConfig {
  id: string
  location_id: string
  name: string
  building: string | null
  unit: string | null
  floor: string | null
  tower: string | null
  responsible: string | null
  observations: string | null
  cpf: string | null
  rg: string | null
  rg_issuer: string | null
  nationality: string | null
  marital_status: string | null
  profession: string | null
  postal_code: string | null
  address: string | null
  city: string | null
  neighborhood: string | null
  state: string | null
  created_at: string
  updated_at: string
}

export interface ProposalMatchData {
  id: string
  name: string
  opportunity_id: string
  status: string
  agency_id: string
  unit_number: string
  building_name: string
  primary_contact_name: string
  proposal_date: string
  total_installments_amount: number
}

class DataService {
  async fetchProposalsData(agencyId: string): Promise<ProposalListItem[]> {
    const cacheKey = `${CACHE_KEYS.LISTINGS}_proposals_${agencyId}`
    
    const cachedData = userCache.get<ProposalListItem[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase
        .from('proposals_match')
        .select('*')
        .order('proposal_date', { ascending: false })

      if (error) {
        throw new Error(`Erro ao buscar propostas: ${error.message}`)
      }

      const proposals: ProposalListItem[] = (data || []).map((item: ProposalMatchData) => ({
        id: item.id,
        title: item.name || 'Proposta sem nome',
        primaryContactName: item.primary_contact_name || 'Contato não informado',
        development: item.building_name || 'Empreendimento não informado',
        unit: item.unit_number || 'Unidade não informada',
        status: this.mapProposalStatus(item.status),
        proposalDate: item.proposal_date,
        price: item.total_installments_amount || 0,
        assignedAgent: 'Sistema'
      }))

      userCache.set(cacheKey, proposals, 5 * 60 * 1000)
      return proposals
    } catch (error) {
      console.error('Erro ao buscar dados das propostas:', error)
      return []
    }
  }

  async fetchAgencyConfig(locationId: string): Promise<AgencyConfig | null> {
    const cacheKey = `${CACHE_KEYS.USER_PROFILE}_agency_config_${locationId}`
    
    const cachedData = userCache.get<AgencyConfig>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase
        .from('agency_config')
        .select('*')
        .eq('location_id', locationId)
        .single()


      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Erro ao buscar configuração da agência: ${error.message}`)
      }

      userCache.set(cacheKey, data, 10 * 60 * 1000)
      return data
    } catch (error) {
      console.error('❌ Erro ao buscar configuração da agência:', error)
      return null
    }
  }

  private mapProposalStatus(status: string): 'em_analise' | 'aprovada' | 'negada' {
    switch (status?.toLowerCase()) {
      case 'aprovada':
      case 'approved':
        return 'aprovada'
      case 'negada':
      case 'rejected':
      case 'denied':
        return 'negada'
      default:
        return 'em_analise'
    }
  }

  clearProposalsCache(agencyId: string): void {
    const cacheKey = `${CACHE_KEYS.LISTINGS}_proposals_${agencyId}`
    userCache.delete(cacheKey)
  }

  clearAgencyConfigCache(locationId: string): void {
    const cacheKey = `${CACHE_KEYS.USER_PROFILE}_agency_config_${locationId}`
    userCache.delete(cacheKey)
  }

  async updateAgencyConfig(locationId: string, configData: {
    opportunityFields: {
      empreendimento: string
      unidade: string
      andar: string
      torre: string
      responsavel: string
      observacoes: string
    }
    contactFields: {
      cpf: string
      rg: string
      orgaoEmissor: string
      nacionalidade: string
      estadoCivil: string
      profissao: string
      cep: string
      endereco: string
      cidade: string
      bairro: string
      estado: string
    }
  }): Promise<AgencyConfig | null> {
    try {

      const supabase = await getSupabase()
      
      const updateData = {
        building: configData.opportunityFields.empreendimento || null,
        unit: configData.opportunityFields.unidade || null,
        floor: configData.opportunityFields.andar || null,
        tower: configData.opportunityFields.torre || null,
        responsible: configData.opportunityFields.responsavel || null,
        observations: configData.opportunityFields.observacoes || null,
        cpf: configData.contactFields.cpf || null,
        rg: configData.contactFields.rg || null,
        rg_issuer: configData.contactFields.orgaoEmissor || null,
        nationality: configData.contactFields.nacionalidade || null,
        marital_status: configData.contactFields.estadoCivil || null,
        profession: configData.contactFields.profissao || null,
        postal_code: configData.contactFields.cep || null,
        address: configData.contactFields.endereco || null,
        city: configData.contactFields.cidade || null,
        neighborhood: configData.contactFields.bairro || null,
        state: configData.contactFields.estado || null,
        updated_at: new Date().toISOString()
      }


      const { data, error } = await supabase
        .from('agency_config')
        .update(updateData)
        .eq('location_id', locationId)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar configuração:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('❌ Erro ao atualizar configuração da agência:', error)
      throw error
    }
  }

  async fetchAgencyConfigOnly(locationId: string): Promise<AgencyConfig | null> {
    return await this.fetchAgencyConfig(locationId)
  }

  async fetchCustomFieldIdsForConfig(locationId: string, config: AgencyConfig): Promise<{
    opportunityFields: Record<string, string>
    contactFields: Record<string, string>
  }> {
    // Extrair keys não-nulas dos campos
    const opportunityKeys = [
      config.building,
      config.unit,
      config.floor,
      config.tower,
      config.responsible,
      config.observations
    ].filter(key => key && key.trim())

    const contactKeys = [
      config.cpf,
      config.rg,
      config.rg_issuer,
      config.nationality,
      config.marital_status,
      config.profession,
      config.postal_code,
      config.address,
      config.city,
      config.neighborhood,
      config.state
    ].filter(key => key && key.trim())

    // Buscar IDs dos custom fields
    const customFieldIds = await customFieldsService.findCustomFieldIds(
      locationId,
      opportunityKeys.filter(key => key !== null) as string[],
      contactKeys.filter(key => key !== null) as string[]
    )

    return customFieldIds
  }

  async fetchAgencyConfigWithCustomFields(locationId: string): Promise<{
    config: AgencyConfig | null
    customFieldIds: {
      opportunityFields: Record<string, string>
      contactFields: Record<string, string>
    }
  }> {
    
    // Buscar configuração da agência
    const config = await this.fetchAgencyConfig(locationId)
    
    if (!config) {
      return {
        config: null,
        customFieldIds: {
          opportunityFields: {},
          contactFields: {}
        }
      }
    }

    // Extrair keys não-nulas dos campos
    const opportunityKeys = [
      config.building,
      config.unit,
      config.floor,
      config.tower,
      config.responsible,
      config.observations
    ].filter(key => key && key.trim())

    const contactKeys = [
      config.cpf,
      config.rg,
      config.rg_issuer,
      config.nationality,
      config.marital_status,
      config.profession,
      config.postal_code,
      config.address,
      config.city,
      config.neighborhood,
      config.state
    ].filter(key => key && key.trim())


    // Buscar IDs dos custom fields
    const customFieldIds = await customFieldsService.findCustomFieldIds(
      locationId,
      opportunityKeys.filter(key => key !== null) as string[],
      contactKeys.filter(key => key !== null) as string[]
    )


    return {
      config,
      customFieldIds
    }
  }

  async saveAgencyConfigAndRemapFields(locationId: string, configData: {
    opportunityFields: {
      empreendimento: string
      unidade: string
      andar: string
      torre: string
      responsavel: string
      observacoes: string
    }
    contactFields: {
      cpf: string
      rg: string
      orgaoEmissor: string
      nacionalidade: string
      estadoCivil: string
      profissao: string
      cep: string
      endereco: string
      cidade: string
      bairro: string
      estado: string
    }
  }): Promise<{
    config: AgencyConfig | null
    customFieldIds: {
      opportunityFields: Record<string, string>
      contactFields: Record<string, string>
    }
  }> {
    try {
      
      // 1. Atualizar configuração na tabela
      const updatedConfig = await this.updateAgencyConfig(locationId, configData)
      
      if (!updatedConfig) {
        throw new Error('Falha ao atualizar configuração')
      }

      // 2. Limpar cache da configuração
      this.clearAgencyConfigCache(locationId)

      // 3. Remapear custom fields com a nova configuração
      const result = await this.fetchAgencyConfigWithCustomFields(locationId)
      
      return result
    } catch (error) {
      console.error('❌ Erro ao salvar configuração e remapear campos:', error)
      throw error
    }
  }
}

export const dataService = new DataService()
