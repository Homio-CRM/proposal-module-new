export type PermissionType = 'admin' | 'adminAndUser'

export interface PreferencesRecord {
  id: number
  agency: number
  created_at: string
  canViewProposals: PermissionType
  canManageProposals: PermissionType
  canViewBuildings: PermissionType
  canManageBuildings: PermissionType
  canManageOnlyAssinedProposals: boolean
}

export type PreferencesPayload = Pick<
  PreferencesRecord,
  | 'canViewProposals'
  | 'canManageProposals'
  | 'canViewBuildings'
  | 'canManageBuildings'
  | 'canManageOnlyAssinedProposals'
>

