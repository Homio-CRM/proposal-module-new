'use client'

import { createContext, useContext } from 'react'
import useUserData from '@/hooks/useUserData'
import type { UserDataContextType, ProviderProps } from '@/lib/types'

const UserDataContext = createContext<UserDataContextType | undefined>(undefined)

export function UserDataProvider({ children }: ProviderProps) {
    const { userData, loading, error } = useUserData()

    return (
        <UserDataContext.Provider value={{ userData, loading, error }}>
            {children}
        </UserDataContext.Provider>
    )
}

export function useUserDataContext(): UserDataContextType {
    const context = useContext(UserDataContext)

    if (context === undefined) {
        throw new Error('useUserDataContext must be used within a UserDataProvider')
    }

    return context
}
