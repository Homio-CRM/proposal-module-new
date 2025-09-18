export interface UserData {
    userId: string
    companyId: string
    role: UserRole
    type: string
    activeLocation: string
    userName: string
    email: string
}

export type UserRole = 'admin' | 'user'

export interface UseUserDataReturn {
    userData: UserData | null
    loading: boolean
    error: string | null
}

export interface UserDataContextType {
    userData: UserData | null
    loading: boolean
    error: string | null
}

export interface ProviderProps {
    children: React.ReactNode
}
