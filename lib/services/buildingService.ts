import { getSupabase } from '@/lib/supabaseClient'
import { Building, Unit, BuildingWithUnits, BuildingListItem, UnitStatus, UnitStatusDB } from '@/lib/types/building'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { dataService } from './dataService'
import { sendUnitStatusWebhook } from '@/lib/utils/unitWebhook'

export function mapStatusFromDB(status: UnitStatusDB): UnitStatus {
  const statusMap: Record<UnitStatusDB, UnitStatus> = {
    'available': 'livre',
    'reserved': 'reservado',
    'sold': 'vendido'
  }
  return statusMap[status]
}

export function mapStatusToDB(status: UnitStatus): UnitStatusDB {
  const statusMap: Record<UnitStatus, UnitStatusDB> = {
    'livre': 'available',
    'reservado': 'reserved',
    'vendido': 'sold'
  }
  return statusMap[status]
}

interface BuildingDBRow {
  id: string
  name: string
  address: string
  city: string
  state: string
  agency_id: string
  created_at: string
  updated_at: string
}

interface UnitDBRow {
  id: string
  building_id: string
  number: string
  floor: string
  tower: string
  name: string
  status: UnitStatusDB
  agency_id: string
  created_at: string
  updated_at: string
}

class BuildingService {
  async fetchBuildingsListData(agencyId: string): Promise<BuildingListItem[]> {
    const cacheKey = `${CACHE_KEYS.LISTINGS}_buildings_${agencyId}`
    
    const cachedData = userCache.get<BuildingListItem[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    try {
      const supabase = await getSupabase()
      
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .order('name', { ascending: true })

      if (buildingsError) {
        console.error('🏠 [BuildingService] Error fetching buildings:', buildingsError)
        throw new Error(`Erro ao buscar empreendimentos: ${buildingsError.message}`)
      }


      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('id, building_id, status')

      if (unitsError) {
        console.error('🏠 [BuildingService] Error fetching units:', unitsError)
        throw new Error(`Erro ao buscar unidades: ${unitsError.message}`)
      }


      const buildingsList: BuildingListItem[] = (buildingsData || []).map((building: BuildingDBRow) => {
        const buildingUnits = (unitsData || []).filter((unit: { building_id: string }) => unit.building_id === building.id)
        
        const totalUnits = buildingUnits.length
        const availableUnits = buildingUnits.filter((u: { status: UnitStatusDB }) => u.status === 'available').length
        const reservedUnits = buildingUnits.filter((u: { status: UnitStatusDB }) => u.status === 'reserved').length
        const soldUnits = buildingUnits.filter((u: { status: UnitStatusDB }) => u.status === 'sold').length

        return {
          id: building.id,
          name: building.name,
          address: building.address,
          city: building.city,
          state: building.state,
          totalUnits,
          availableUnits,
          reservedUnits,
          soldUnits
        }
      })

      userCache.set(cacheKey, buildingsList, 5 * 60 * 1000)
      return buildingsList
    } catch (error) {
      console.error('🏠 [BuildingService] Error in fetchBuildingsListData:', error)
      throw error
    }
  }

  async fetchBuildingWithUnits(buildingId: string, agencyId: string): Promise<BuildingWithUnits | null> {
    const cacheKey = `${CACHE_KEYS.LISTINGS}_building_${buildingId}_${agencyId}`
    
    const cachedData = userCache.get<BuildingWithUnits>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    try {
      const supabase = await getSupabase()
      
      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single()

      if (buildingError || !buildingData) {
        console.warn('🏠 [BuildingService] Building not found or error:', buildingError)
        return null
      }

      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('building_id', buildingId)
        .order('floor', { ascending: true })
        .order('number', { ascending: true })

      if (unitsError) {
        console.error('🏠 [BuildingService] Error fetching units for building:', unitsError)
        throw new Error(`Erro ao buscar unidades: ${unitsError.message}`)
      }

      const units: Unit[] = (unitsData || []).map((unit: UnitDBRow) => ({
        id: unit.id,
        building_id: unit.building_id,
        number: unit.number,
        floor: unit.floor,
        tower: unit.tower,
        name: unit.name,
        status: mapStatusFromDB(unit.status),
        agency_id: unit.agency_id,
        created_at: unit.created_at,
        updated_at: unit.updated_at
      }))

      const totalUnits = units.length
      const availableUnits = units.filter(u => u.status === 'livre').length
      const reservedUnits = units.filter(u => u.status === 'reservado').length
      const soldUnits = units.filter(u => u.status === 'vendido').length

      const buildingWithUnits: BuildingWithUnits = {
        id: buildingData.id,
        name: buildingData.name,
        address: buildingData.address,
        city: buildingData.city,
        state: buildingData.state,
        agency_id: buildingData.agency_id,
        created_at: buildingData.created_at,
        updated_at: buildingData.updated_at,
        units,
        totalUnits,
        availableUnits,
        reservedUnits,
        soldUnits
      }

      userCache.set(cacheKey, buildingWithUnits, 5 * 60 * 1000)
      return buildingWithUnits
    } catch (error) {
      console.error('🏠 [BuildingService] Error in fetchBuildingWithUnits:', error)
      throw error
    }
  }

  async updateUnit(
    unitId: string, 
    updates: { name?: string; number?: string; floor?: string; tower?: string }
  ): Promise<Unit> {
    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase
        .from('units')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', unitId)
        .select()
        .single()

      if (error) {
        console.error('🏠 [BuildingService] Error updating unit:', error)
        throw new Error(`Erro ao atualizar unidade: ${error.message}`)
      }

      if (!data) {
        throw new Error('Unidade não encontrada')
      }

      const updatedUnit: Unit = {
        id: data.id,
        building_id: data.building_id,
        number: data.number,
        floor: data.floor,
        tower: data.tower,
        name: data.name,
        status: mapStatusFromDB(data.status),
        agency_id: data.agency_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      userCache.delete(`${CACHE_KEYS.LISTINGS}_building_${data.building_id}_${data.agency_id}`)
      userCache.delete(`${CACHE_KEYS.LISTINGS}_buildings_${data.agency_id}`)

      return updatedUnit
    } catch (error) {
      console.error('🏠 [BuildingService] Error in updateUnit:', error)
      throw error
    }
  }

  async updateUnitStatus(unitId: string, status: UnitStatus): Promise<Unit> {
    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase
        .from('units')
        .update({
          status: mapStatusToDB(status),
          updated_at: new Date().toISOString()
        })
        .eq('id', unitId)
        .select()
        .single()

      if (error) {
        console.error('🏠 [BuildingService] Error updating unit status:', error)
        throw new Error(`Erro ao atualizar status da unidade: ${error.message}`)
      }

      if (!data) {
        throw new Error('Unidade não encontrada')
      }

      const updatedUnit: Unit = {
        id: data.id,
        building_id: data.building_id,
        number: data.number,
        floor: data.floor,
        tower: data.tower,
        name: data.name,
        status: mapStatusFromDB(data.status),
        agency_id: data.agency_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      const webhookResult = await sendUnitStatusWebhook(
        updatedUnit.id,
        updatedUnit.name,
        updatedUnit.status
      )

      if (!webhookResult.success) {
        const error = new Error('WEBHOOK_ERROR') as Error & { webhookError: boolean; webhookMessage?: string }
        error.webhookError = true
        error.webhookMessage = webhookResult.message
        throw error
      }

      userCache.delete(`${CACHE_KEYS.LISTINGS}_building_${data.building_id}_${data.agency_id}`)
      userCache.delete(`${CACHE_KEYS.LISTINGS}_buildings_${data.agency_id}`)

      return updatedUnit
    } catch (error) {
      console.error('🏠 [BuildingService] Error in updateUnitStatus:', error)
      throw error
    }
  }

  async updateBuilding(
    buildingId: string, 
    updates: { name?: string; address?: string; city?: string; state?: string }
  ): Promise<Building> {
    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase
        .from('buildings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', buildingId)
        .select()
        .single()

      if (error) {
        console.error('🏠 [BuildingService] Error updating building:', error)
        throw new Error(`Erro ao atualizar empreendimento: ${error.message}`)
      }

      if (!data) {
        throw new Error('Empreendimento não encontrado')
      }

      const updatedBuilding: Building = {
        id: data.id,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        agency_id: data.agency_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      userCache.delete(`${CACHE_KEYS.LISTINGS}_building_${buildingId}_${data.agency_id}`)
      userCache.delete(`${CACHE_KEYS.LISTINGS}_buildings_${data.agency_id}`)

      return updatedBuilding
    } catch (error) {
      console.error('🏠 [BuildingService] Error in updateBuilding:', error)
      throw error
    }
  }

  async deleteUnit(unitId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      
      // 1. Buscar todas as propostas relacionadas à unidade
      const { data: proposals, error: proposalsError } = await supabase
        .from('proposals')
        .select('id')
        .eq('unit_id', unitId)

      if (proposalsError) {
        throw new Error(`Erro ao buscar propostas da unidade: ${proposalsError.message}`)
      }

      // 2. Deletar todas as propostas (que por sua vez deletam installments e contacts)
      if (proposals && proposals.length > 0) {
        for (const proposal of proposals) {
          await dataService.deleteProposal(proposal.id)
        }
      }

      // 3. Deletar a unidade
      const { error: unitError } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId)

      if (unitError) {
        throw new Error(`Erro ao deletar unidade: ${unitError.message}`)
      }

      // 4. Invalidar cache (limpar todos os caches de building)
      userCache.clear()

    } catch (error) {
      console.error('🏠 [BuildingService] Error in deleteUnit:', error)
      throw error
    }
  }

  async deleteBuilding(buildingId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      
      // 1. Buscar todas as unidades do empreendimento
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id')
        .eq('building_id', buildingId)

      if (unitsError) {
        throw new Error(`Erro ao buscar unidades do empreendimento: ${unitsError.message}`)
      }

      // 2. Deletar todas as unidades (que por sua vez deletam propostas, installments e contacts)
      if (units && units.length > 0) {
        for (const unit of units) {
          await this.deleteUnit(unit.id)
        }
      }

      // 3. Deletar o empreendimento
      const { error: buildingError } = await supabase
        .from('buildings')
        .delete()
        .eq('id', buildingId)

      if (buildingError) {
        throw new Error(`Erro ao deletar empreendimento: ${buildingError.message}`)
      }

      // 4. Invalidar cache (limpar todos os caches de building)
      userCache.clear()

    } catch (error) {
      console.error('🏠 [BuildingService] Error in deleteBuilding:', error)
      throw error
    }
  }
}

export const buildingService = new BuildingService() 
