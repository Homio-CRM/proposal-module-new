import type { UserRole, RolePermissions } from '@/lib/types/roles'
import { ROLE_PERMISSIONS } from '@/lib/types/roles'

export function serverHasPermission(userRole: UserRole, permission: keyof RolePermissions): boolean {
    return ROLE_PERMISSIONS[userRole]?.[permission] ?? false
}

export function serverGetUserPermissions(userRole: UserRole): RolePermissions {
    return ROLE_PERMISSIONS[userRole] ?? ROLE_PERMISSIONS.user
}

export function validateUserRole(role: string): role is UserRole {
    return ['admin', 'user'].includes(role)
}
