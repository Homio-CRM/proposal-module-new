import type { UserRole } from './core'

export type { UserRole }

export interface RolePermissions {
    canCreateListing: boolean
    canEditListing: boolean
    canDeleteListing: boolean
    canViewAllListings: boolean
    canManageUsers: boolean
    canExportData: boolean
    canImportData: boolean
    canManageSettings: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    admin: {
        canCreateListing: true,
        canEditListing: true,
        canDeleteListing: true,
        canViewAllListings: true,
        canManageUsers: true,
        canExportData: true,
        canImportData: true,
        canManageSettings: true,
    },
    user: {
        canCreateListing: true,
        canEditListing: true,
        canDeleteListing: false,
        canViewAllListings: false,
        canManageUsers: false,
        canExportData: false,
        canImportData: false,
        canManageSettings: false,
    },
}
