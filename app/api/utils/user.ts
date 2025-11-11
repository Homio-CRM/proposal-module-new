import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'

export async function getUserRoleById(
  client: SupabaseClient,
  userId: string
): Promise<UserRole> {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data || !data.role) {
    return 'user'
  }

  return data.role as UserRole
}

