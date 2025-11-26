import { getSupabase } from '@/lib/supabaseClient'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { customFieldsService } from './customFieldsService'
import type { ProposalListItem, ProposalFormData } from '@/lib/types/proposal'


export interface AgencyConfig {
  id: string
  location_id: string
  opportunity_name: string
  opportunity_building: string | null
  opportunity_unit: string | null
  opportunity_responsible: string | null
  opportunity_observations: string | null
  opportunity_reserve_until: string | null
  contact_building: string | null
  contact_unit: string | null
  contact_floor: string | null
  contact_tower: string | null
  contact_cpf: string | null
  contact_rg: string | null
  contact_rg_issuer: string | null
  contact_nationality: string | null
  contact_marital_status: string | null
  contact_profession: string | null
  contact_postal_code: string | null
  contact_address: string | null
  contact_city: string | null
  contact_neighborhood: string | null
  contact_state: string | null
  table_url: string | null
  created_at: string
  updated_at: string
}

export interface ProposalMatchData {
  id: string
  name: string
  opportunity_id: string
  status: string
  agency_id: string
  created_by?: string | null
  unit_name: string
  building_name: string
  primary_contact_name: string
  proposal_date: string
  total_installments_amount: number
}

export interface ProfileWithProposals {
  id: string
  name: string | null
  role: string | null
  agency_id: string
}

class DataService {
  async fetchProposalsByUnit(
    unitId: string,
    options: { restrictToUserId?: string } = {}
  ): Promise<ProposalListItem[]> {
    try {
      const supabase = await getSupabase()

      const query = supabase
        .from('proposals')
        .select(`
          id,
          name,
          opportunity_id,
          created_by,
          status,
          proposal_date,
          primary_contact:contacts!proposals_primary_contact_id_fkey(name),
          unit:units(id, name, number, building:buildings(id, name)),
          installments:installments(total_amount)
        `)
        .eq('unit_id', unitId)

      if (options.restrictToUserId) {
        query.eq('created_by', options.restrictToUserId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Erro ao buscar propostas da unidade: ${error.message}`)
      }

      type InstallmentRow = { total_amount?: number | null }
      type ProposalRow = {
        id: string
        name?: string | null
        opportunity_id?: string | null
        created_by?: string | null
        status: string
        proposal_date: string
        primary_contact?: { name?: string | null } | null
        unit?: { id: string; name?: string | null; number?: string | null; building?: { id: string; name?: string | null } | null } | null
        installments?: InstallmentRow[] | null
      }

      const rows: ProposalRow[] = (data as unknown as ProposalRow[]) || []
      const proposals: ProposalListItem[] = rows.map((item: ProposalRow) => {
        const installments = Array.isArray(item.installments) ? item.installments : []
        const totalAmount = installments.reduce((sum: number, inst: InstallmentRow) => sum + Number(inst.total_amount || 0), 0)
        return {
          id: item.id,
          opportunityId: item.opportunity_id ?? undefined,
          title: item.name || 'Proposta sem nome',
          primaryContactName: item.primary_contact?.name || 'Contato não informado',
          development: item.unit?.building?.name || 'Empreendimento não informado',
          unit: item.unit?.name || item.unit?.number || 'Unidade não informada',
          status: this.mapProposalStatus(item.status),
          proposalDate: item.proposal_date,
          price: totalAmount,
          assignedAgent: 'Sistema',
          createdBy: item.created_by || undefined
        }
      })

      let result = proposals
      if (options.restrictToUserId) {
        result = proposals.filter(p => p.createdBy === options.restrictToUserId)
      }

      return result
    } catch {
      return []
    }
  }
  async fetchProposalsData(
    agencyId: string,
    options: { restrictToUserId?: string } = {}
  ): Promise<ProposalListItem[]> {
    const cacheKey = options.restrictToUserId
      ? `${CACHE_KEYS.LISTINGS}_proposals_${agencyId}_${options.restrictToUserId}`
      : `${CACHE_KEYS.LISTINGS}_proposals_${agencyId}`
    
    const cachedData = userCache.get<ProposalListItem[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    try {
      const supabase = await getSupabase()
      
      const query = supabase
        .from('proposals_match')
        .select('*')
        .order('proposal_date', { ascending: false })

      if (options.restrictToUserId) {
        query.eq('created_by', options.restrictToUserId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Erro ao buscar propostas: ${error.message}`)
      }

      const proposals: ProposalListItem[] = (data || []).map((item: ProposalMatchData) => ({
        id: item.id,
        opportunityId: item.opportunity_id,
        title: item.name || 'Proposta sem nome',
        primaryContactName: item.primary_contact_name || 'Contato não informado',
        development: item.building_name || 'Empreendimento não informado',
        unit: item.unit_name || 'Unidade não informada',
        status: this.mapProposalStatus(item.status),
        proposalDate: item.proposal_date,
        price: item.total_installments_amount || 0,
        assignedAgent: 'Sistema',
        createdBy: item.created_by || undefined
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
      case 'em_analise':
      case 'under_review':
      case 'pending':
        return 'em_analise'
      default:
        return 'em_analise'
    }
  }

  async fetchProposalDetails(
    proposalId: string,
    options: { restrictToUserId?: string } = {}
  ): Promise<{ proposalFormData: ProposalFormData; createdByName: string | null } | null> {
    try {
      const supabase = await getSupabase()
      
      // Buscar proposta com contatos e unidade
      const query = supabase
        .from('proposals')
        .select(`
          *,
          primary_contact:contacts!proposals_primary_contact_id_fkey(*),
          secondary_contact:contacts!proposals_secondary_contact_id_fkey(*),
          unit:units(*, building:buildings(*))
        `)
        .eq('id', proposalId)

      if (options.restrictToUserId) {
        query.eq('created_by', options.restrictToUserId)
      }

      const { data: proposalData, error: proposalError } = await query.single()

      if (proposalError) {
        if (proposalError.code === 'PGRST116') {
          return null
        }
        throw new Error(`Erro ao buscar proposta: ${proposalError.message}`)
      }

      // Buscar parcelas
      const { data: installmentsData, error: installmentsError } = await supabase
        .from('installments')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('start_date', { ascending: true })

      if (installmentsError) {
        throw new Error(`Erro ao buscar parcelas: ${installmentsError.message}`)
      }

      // Mapear para ProposalFormData
      const proposalFormData: ProposalFormData = {
        proposal: {
          opportunityId: proposalData.opportunity_id,
          proposalDate: proposalData.proposal_date,
          proposalName: proposalData.name,
          responsible: proposalData.responsible,
          proposalType: 'Venda',
          proposalStatus: this.mapProposalStatus(proposalData.status),
          priority: 'Média',
          source: 'Sistema',
          externalReference: '',
          validUntil: '',
          assignedAgent: proposalData.responsible
        },
        primaryContact: {
          name: proposalData.primary_contact?.name || '',
          cpf: '',
          rg: '',
          rgIssuer: '',
          nationality: '',
          maritalStatus: '',
          birthDate: '',
          email: '',
          phone: '',
          address: '',
          zipCode: '',
          city: '',
          neighborhood: '',
          state: '',
          homioId: proposalData.primary_contact?.homio_id || ''
        },
        property: {
          development: proposalData.unit?.building?.name || '',
          unit: proposalData.unit?.name || '',
          floor: proposalData.unit?.floor || '',
          tower: proposalData.unit?.tower || '',
          reservedUntil: proposalData.reserved_until || '',
          observations: proposalData.notes || '',
          unitId: proposalData.unit_id,
          buildingId: proposalData.unit?.building?.id,
          unitStatus: proposalData.unit?.status || '',
          shouldReserveUnit: !!proposalData.reserved_until
        },
        installments: (installmentsData || []).map((installment) => ({
          id: installment.id,
          condition: this.mapInstallmentType(installment.type),
          value: Number(installment.amount_per_installment),
          quantity: installment.installments_count,
          date: installment.start_date
        }))
      }

      // Adicionar contato secundário se existir
      if (proposalData.secondary_contact) {
        proposalFormData.additionalContact = {
          name: proposalData.secondary_contact.name,
          cpf: '',
          rg: '',
          rgIssuer: '',
          nationality: '',
          maritalStatus: '',
          birthDate: '',
          email: '',
          phone: '',
          address: '',
          zipCode: '',
          city: '',
          neighborhood: '',
          state: '',
          homioId: proposalData.secondary_contact.homio_id || ''
        }
      }

      let createdByName: string | null = null
      
      const proposalDataTyped = proposalData as { 
        created_by?: string | null
      }
      
      if (proposalDataTyped.created_by) {
        try {
          const viewQuery = supabase
            .from('profiles_proposals_match')
            .select('name')
            .eq('id', proposalDataTyped.created_by)
          
          const viewResponse = await viewQuery.maybeSingle()
          
          if (!viewResponse.error && viewResponse.data?.name) {
            createdByName = viewResponse.data.name
          } else {
            const profileQuery = supabase
              .from('profiles')
              .select('name')
              .eq('id', proposalDataTyped.created_by)
            
            const profileResponse = await profileQuery.maybeSingle()
            
            if (!profileResponse.error && profileResponse.data?.name) {
              createdByName = profileResponse.data.name
            }
          }
        } catch {
          
        }
      }

      return { proposalFormData, createdByName }
    } catch (error) {
      console.error('Erro ao buscar detalhes da proposta:', error)
      return null
    }
  }

  private mapInstallmentType(type: string): 'sinal' | 'parcela_unica' | 'financiamento' | 'mensais' | 'intermediarias' | 'anuais' | 'semestrais' | 'bimestrais' | 'trimestrais' {
    switch (type?.toLowerCase()) {
      case 'sinal':
        return 'sinal'
      case 'parcela_unica':
        return 'parcela_unica'
      case 'financiamento':
        return 'financiamento'
      case 'mensais':
        return 'mensais'
      case 'intermediarias':
        return 'intermediarias'
      case 'anuais':
        return 'anuais'
      case 'semestrais':
        return 'semestrais'
      case 'bimestrais':
        return 'bimestrais'
      case 'trimestrais':
        return 'trimestrais'
      default:
        return 'mensais'
    }
  }

  clearProposalsCache(agencyId: string, options: { restrictToUserId?: string } = {}): void {
    const defaultKey = `${CACHE_KEYS.LISTINGS}_proposals_${agencyId}`
    userCache.delete(defaultKey)
    if (options.restrictToUserId) {
      const userKey = `${CACHE_KEYS.LISTINGS}_proposals_${agencyId}_${options.restrictToUserId}`
      userCache.delete(userKey)
    }
  }

  clearAgencyConfigCache(locationId: string): void {
    const cacheKey = `${CACHE_KEYS.USER_PROFILE}_agency_config_${locationId}`
    userCache.delete(cacheKey)
  }

  async fetchProfilesWithProposals(agencyId: string): Promise<ProfileWithProposals[]> {
    const cacheKey = `${CACHE_KEYS.USER_PROFILE}_profiles_with_proposals_${agencyId}`
    
    const cachedData = userCache.get<ProfileWithProposals[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase
        .from('profiles_proposals_match')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        throw new Error(`Erro ao buscar profiles: ${error.message}`)
      }

      const profiles: ProfileWithProposals[] = (data || []).map((item: ProfileWithProposals) => ({
        id: item.id,
        name: item.name,
        role: item.role,
        agency_id: item.agency_id
      }))

      userCache.set(cacheKey, profiles, 5 * 60 * 1000)
      return profiles
    } catch (error) {
      console.error('Erro ao buscar profiles com propostas:', error)
      return []
    }
  }

  async deleteProposal(proposalId: string, options: { restrictToUserId?: string } = {}): Promise<void> {
    try {
      const supabase = await getSupabase()

      if (options.restrictToUserId) {
        const { data: ownerCheck, error: ownerError } = await supabase
          .from('proposals')
          .select('created_by')
          .eq('id', proposalId)
          .single()

        if (ownerError) {
          throw new Error(`Erro ao verificar proprietário da proposta: ${ownerError.message}`)
        }

        if (ownerCheck?.created_by && ownerCheck.created_by !== options.restrictToUserId) {
          throw new Error('Sem permissão para deletar esta proposta')
        }
      }
      
      // 1. Delete installments first
      const { error: installmentsError } = await supabase
        .from('installments')
        .delete()
        .eq('proposal_id', proposalId)
      
      if (installmentsError) {
        throw new Error(`Erro ao deletar parcelas: ${installmentsError.message}`)
      }
      
      // 2. Get proposal to find contact IDs
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('primary_contact_id, secondary_contact_id')
        .eq('id', proposalId)
        .single()
      
      if (proposalError) {
        throw new Error(`Erro ao buscar proposta: ${proposalError.message}`)
      }
      
      // 3. Delete the proposal
      const { error: deleteError } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId)
      
      if (deleteError) {
        throw new Error(`Erro ao deletar proposta: ${deleteError.message}`)
      }
      
      // 4. Check if contacts are used by other proposals before deleting
      if (proposal.primary_contact_id) {
        
        const { count: primaryCount, error: primaryCountError } = await supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .or(`primary_contact_id.eq.${proposal.primary_contact_id},secondary_contact_id.eq.${proposal.primary_contact_id}`)


        if (primaryCountError) {
          throw new Error(`Erro ao verificar uso do contato primário: ${primaryCountError.message}`)
        }

        if (!primaryCount || primaryCount === 0) {
          const { error: deletePrimaryError } = await supabase
            .from('contacts')
            .delete()
            .eq('id', proposal.primary_contact_id)
          
          if (deletePrimaryError) {
            throw new Error(`Erro ao deletar contato primário: ${deletePrimaryError.message}`)
          }
        }
      }

      if (proposal.secondary_contact_id) {
        
        const { count: secondaryCount, error: secondaryCountError } = await supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .or(`primary_contact_id.eq.${proposal.secondary_contact_id},secondary_contact_id.eq.${proposal.secondary_contact_id}`)


        if (secondaryCountError) {
          throw new Error(`Erro ao verificar uso do contato secundário: ${secondaryCountError.message}`)
        }

        if (!secondaryCount || secondaryCount === 0) {
          const { error: deleteSecondaryError } = await supabase
            .from('contacts')
            .delete()
            .eq('id', proposal.secondary_contact_id)
          
          if (deleteSecondaryError) {
            throw new Error(`Erro ao deletar contato secundário: ${deleteSecondaryError.message}`)
          } 
        } 
      }
      
    } catch (error) {
      console.error('Erro ao deletar proposta:', error)
      throw error
    }
  }

  async updateAgencyConfig(locationId: string, configData: {
    opportunityFields: {
      empreendimento: string
      unidade: string
      responsavel: string
      observacoes: string
      reserve_until: string
    }
    contactFields: {
      empreendimento: string
      unidade: string
      andar: string
      torre: string
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
    table_url?: string
  }): Promise<AgencyConfig | null> {
    try {

      const supabase = await getSupabase()
      
      const updateData = {
        opportunity_building: configData.opportunityFields.empreendimento || null,
        opportunity_unit: configData.opportunityFields.unidade || null,
        opportunity_responsible: configData.opportunityFields.responsavel || null,
        opportunity_observations: configData.opportunityFields.observacoes || null,
        opportunity_reserve_until: configData.opportunityFields.reserve_until || null,
        contact_building: configData.contactFields.empreendimento || null,
        contact_unit: configData.contactFields.unidade || null,
        contact_floor: configData.contactFields.andar || null,
        contact_tower: configData.contactFields.torre || null,
        contact_cpf: configData.contactFields.cpf || null,
        contact_rg: configData.contactFields.rg || null,
        contact_rg_issuer: configData.contactFields.orgaoEmissor || null,
        contact_nationality: configData.contactFields.nacionalidade || null,
        contact_marital_status: configData.contactFields.estadoCivil || null,
        contact_profession: configData.contactFields.profissao || null,
        contact_postal_code: configData.contactFields.cep || null,
        contact_address: configData.contactFields.endereco || null,
        contact_city: configData.contactFields.cidade || null,
        contact_neighborhood: configData.contactFields.bairro || null,
        contact_state: configData.contactFields.estado || null,
        table_url: configData.table_url || null,
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
      config.opportunity_building,
      config.opportunity_unit,
      config.opportunity_responsible,
      config.opportunity_observations,
      config.opportunity_reserve_until
    ].filter(key => key && key.trim())

    const contactKeys = [
      config.contact_building,
      config.contact_unit,
      config.contact_floor,
      config.contact_tower,
      config.contact_cpf,
      config.contact_rg,
      config.contact_rg_issuer,
      config.contact_nationality,
      config.contact_marital_status,
      config.contact_profession,
      config.contact_postal_code,
      config.contact_address,
      config.contact_city,
      config.contact_neighborhood,
      config.contact_state
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
      config.opportunity_building,
      config.opportunity_unit,
      config.opportunity_responsible,
      config.opportunity_observations,
      config.opportunity_reserve_until
    ].filter(key => key && key.trim())

    const contactKeys = [
      config.contact_building,
      config.contact_unit,
      config.contact_floor,
      config.contact_tower,
      config.contact_cpf,
      config.contact_rg,
      config.contact_rg_issuer,
      config.contact_nationality,
      config.contact_marital_status,
      config.contact_profession,
      config.contact_postal_code,
      config.contact_address,
      config.contact_city,
      config.contact_neighborhood,
      config.contact_state
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
      responsavel: string
      observacoes: string
      reserve_until: string
    }
    contactFields: {
      empreendimento: string
      unidade: string
      andar: string
      torre: string
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
    table_url?: string
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