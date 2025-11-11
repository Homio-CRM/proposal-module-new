import type { UserRole, RolePermissions } from '@/lib/types/roles'
import { ROLE_PERMISSIONS } from '@/lib/types/roles'
import type { PreferencesRecord, PermissionType } from '@/lib/types/preferences'

export function serverHasPermission(userRole: UserRole, permission: keyof RolePermissions): boolean {
    return ROLE_PERMISSIONS[userRole]?.[permission] ?? false
}

export function serverGetUserPermissions(userRole: UserRole): RolePermissions {
    return ROLE_PERMISSIONS[userRole] ?? ROLE_PERMISSIONS.user
}

export function validateUserRole(role: string): role is UserRole {
    return ['admin', 'user'].includes(role)
}

export function permissionAllowsUser(permission: PermissionType, role: UserRole): boolean {
    if (role === 'admin') {
        return true
    }
    return permission === 'adminAndUser'
}

export function canViewProposals(preferences: PreferencesRecord | null, role: UserRole): boolean {
    if (!preferences) {
        return role === 'admin'
    }
    return permissionAllowsUser(preferences.canViewProposals, role)
}

export function canManageProposals(preferences: PreferencesRecord | null, role: UserRole): boolean {
    if (!preferences) {
        return role === 'admin'
    }
    return permissionAllowsUser(preferences.canManageProposals, role)
}

export function restrictProposalsToCreator(preferences: PreferencesRecord | null, role: UserRole): boolean {
    if (role === 'admin') {
        return false
    }
    return Boolean(preferences?.canManageOnlyAssinedProposals)
}

export function canViewBuildings(preferences: PreferencesRecord | null, role: UserRole): boolean {
    if (!preferences) {
        return role === 'admin'
    }
    return permissionAllowsUser(preferences.canViewBuildings, role)
}

export function canManageBuildings(preferences: PreferencesRecord | null, role: UserRole): boolean {
    if (!preferences) {
        return role === 'admin'
    }
    return permissionAllowsUser(preferences.canManageBuildings, role)
}
