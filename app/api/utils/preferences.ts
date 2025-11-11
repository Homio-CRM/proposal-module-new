import type { SupabaseClient } from '@supabase/supabase-js'
import type { PreferencesRecord } from '@/lib/types/preferences'

type RawPreferences = {
  id: number
  agency: number
  created_at: string
  canViewProposals: string
  canManageProposals: string
  canViewBuildings: string
  canManageBuildings: string
  canManageOnlyAssinedProposals: boolean
}

function normalizePreferences(data: RawPreferences): PreferencesRecord {
  return {
    id: Number(data.id),
    agency: Number(data.agency),
    created_at: data.created_at,
    canViewProposals: data.canViewProposals as PreferencesRecord['canViewProposals'],
    canManageProposals: data.canManageProposals as PreferencesRecord['canManageProposals'],
    canViewBuildings: data.canViewBuildings as PreferencesRecord['canViewBuildings'],
    canManageBuildings: data.canManageBuildings as PreferencesRecord['canManageBuildings'],
    canManageOnlyAssinedProposals: Boolean(data.canManageOnlyAssinedProposals)
  }
}

export async function getPreferencesByLocationId(
  client: SupabaseClient,
  locationId: string
): Promise<PreferencesRecord> {
  const { data: agencyConfig, error: agencyError } = await client
    .from('agency_config')
    .select('id')
    .eq('location_id', locationId)
    .single()

  if (agencyError || !agencyConfig) {
    throw new Error('Agency configuration not found for location')
  }

  const { data: existingPreferences, error: preferencesError } = await client
    .from('preferences')
    .select('*')
    .eq('agency', agencyConfig.id)
    .maybeSingle()

  if (preferencesError && preferencesError.code !== 'PGRST116') {
    throw new Error('Failed to fetch preferences')
  }

  if (existingPreferences) {
    return normalizePreferences(existingPreferences as RawPreferences)
  }

  const { data: insertedPreferences, error: insertError } = await client
    .from('preferences')
    .insert({ agency: agencyConfig.id })
    .select('*')
    .single()

  if (insertError || !insertedPreferences) {
    throw new Error('Failed to initialize preferences')
  }

  return normalizePreferences(insertedPreferences as RawPreferences)
}

