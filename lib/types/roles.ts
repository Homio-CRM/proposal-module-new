import type { UserRole } from './core'

export type { UserRole }

export interface RolePermissions {
    canCreate: boolean
    canRead: boolean
    canUpdate: boolean
    canDelete: boolean
    canManageUsers: boolean
    canManageSettings: boolean
    canExportData: boolean
    canImportData: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    admin: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canManageUsers: true,
        canManageSettings: true,
        canExportData: true,
        canImportData: true,
    },
    user: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
        canManageUsers: false,
        canManageSettings: false,
        canExportData: false,
        canImportData: false,
    },
}
