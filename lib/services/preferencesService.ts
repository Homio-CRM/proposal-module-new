import { getSupabase } from '@/lib/supabaseClient'
import { CACHE_KEYS, userCache } from '@/lib/cache/userCache'
import type { PreferencesPayload, PreferencesRecord, PermissionType } from '@/lib/types/preferences'

class PreferencesService {
  private buildCacheKey(locationId: string): string {
    return `${CACHE_KEYS.PREFERENCES}_${locationId}`
  }

  private async resolveAgencyId(locationId: string): Promise<number> {
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('agency_config')
      .select('id')
      .eq('location_id', locationId)
      .single()

    if (error || !data) {
      throw new Error('Agency configuration not found')
    }

    return Number(data.id)
  }

  private async upsertDefaults(locationId: string, agencyId: number): Promise<PreferencesRecord> {
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('preferences')
      .insert({ agency: agencyId })
      .select('*')
      .single()

    if (error || !data) {
      if ((error as { code?: string } | null)?.code === '23505') {
        const existing = await this.fetchByAgencyId(locationId, agencyId)
        if (existing) {
          return existing
        }
      }
      throw new Error('Failed to create preferences')
    }

    const record = this.normalizeRecord(data)
    userCache.set(this.buildCacheKey(locationId), record, 5 * 60 * 1000)
    return record
  }

  private async fetchByAgencyId(locationId: string, agencyId: number): Promise<PreferencesRecord | null> {
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('agency', agencyId)
      .maybeSingle()

    const code = (error as { code?: string } | null)?.code
    if (error && code !== 'PGRST116') {
      throw new Error('Failed to fetch preferences')
    }

    if (!data) {
      return null
    }

    const record = this.normalizeRecord(data)
    userCache.set(this.buildCacheKey(locationId), record, 5 * 60 * 1000)
    return record
  }

  private normalizeRecord(data: Record<string, unknown>): PreferencesRecord {
    return {
      id: Number(data.id),
      agency: Number(data.agency),
      created_at: String(data.created_at),
      canViewProposals: data.canViewProposals as PermissionType,
      canManageProposals: data.canManageProposals as PermissionType,
      canViewBuildings: data.canViewBuildings as PermissionType,
      canManageBuildings: data.canManageBuildings as PermissionType,
      canManageOnlyAssinedProposals: Boolean(data.canManageOnlyAssinedProposals)
    }
  }

  async fetchPreferences(locationId: string): Promise<PreferencesRecord> {
    const cacheKey = this.buildCacheKey(locationId)
    const cached = userCache.get<PreferencesRecord>(cacheKey)
    if (cached) {
      return cached
    }

    const agencyId = await this.resolveAgencyId(locationId)
    const existing = await this.fetchByAgencyId(locationId, agencyId)
    if (existing) {
      return existing
    }
    return this.upsertDefaults(locationId, agencyId)
  }

  async updatePreferences(locationId: string, payload: PreferencesPayload): Promise<PreferencesRecord> {
    const existing = await this.fetchPreferences(locationId)
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('preferences')
      .update(payload)
      .eq('agency', existing.agency)
      .select('*')
      .single()

    if (error || !data) {
      console.error('[preferencesService] Failed to update preferences', error)
      throw new Error('Failed to update preferences')
    }

    const record = this.normalizeRecord(data)
    userCache.set(this.buildCacheKey(locationId), record, 5 * 60 * 1000)
    return record
  }

  clearCache(locationId: string): void {
    userCache.delete(this.buildCacheKey(locationId))
  }
}

export const preferencesService = new PreferencesService()

