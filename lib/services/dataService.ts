import { getSupabase } from '@/lib/supabaseClient'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { customFieldsService } from './customFieldsService'
import type { ProposalListItem, ProposalFormData } from '@/lib/types/proposal'


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
  reserve_until: string | null
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
  unit_name: string
  building_name: string
  primary_contact_name: string
  proposal_date: string
  total_installments_amount: number
}

class DataService {
  async fetchProposalsByUnit(unitId: string): Promise<ProposalListItem[]> {
    try {
      const supabase = await getSupabase()

      const { data, error } = await supabase
        .from('proposals')
        .select(`
          id,
          name,
          opportunity_id,
          status,
          proposal_date,
          primary_contact:contacts!proposals_primary_contact_id_fkey(name),
          unit:units(id, name, number, building:buildings(id, name)),
          installments:installments(total_amount)
        `)
        .eq('unit_id', unitId)

      if (error) {
        throw new Error(`Erro ao buscar propostas da unidade: ${error.message}`)
      }

      type InstallmentRow = { total_amount?: number | null }
      type ProposalRow = {
        id: string
        name?: string | null
        opportunity_id?: string | null
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
          assignedAgent: 'Sistema'
        }
      })

      return proposals
    } catch {
      return []
    }
  }
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
        opportunityId: item.opportunity_id,
        title: item.name || 'Proposta sem nome',
        primaryContactName: item.primary_contact_name || 'Contato não informado',
        development: item.building_name || 'Empreendimento não informado',
        unit: item.unit_name || 'Unidade não informada',
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

  async fetchProposalDetails(proposalId: string): Promise<ProposalFormData | null> {
    try {
      const supabase = await getSupabase()
      
      // Buscar proposta com contatos e unidade
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select(`
          *,
          primary_contact:contacts!proposals_primary_contact_id_fkey(*),
          secondary_contact:contacts!proposals_secondary_contact_id_fkey(*),
          unit:units(*, building:buildings(*))
        `)
        .eq('id', proposalId)
        .single()

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
          unitStatus: proposalData.unit?.status || ''
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


      return proposalFormData
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

  clearProposalsCache(agencyId: string): void {
    const cacheKey = `${CACHE_KEYS.LISTINGS}_proposals_${agencyId}`
    userCache.delete(cacheKey)
  }

  clearAgencyConfigCache(locationId: string): void {
    const cacheKey = `${CACHE_KEYS.USER_PROFILE}_agency_config_${locationId}`
    userCache.delete(cacheKey)
  }

  async deleteProposal(proposalId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      
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
      andar: string
      torre: string
      responsavel: string
      observacoes: string
      reserve_until: string
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
        reserve_until: configData.opportunityFields.reserve_until || null,
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
      config.observations,
      config.reserve_until
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
      reserve_until: string
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
