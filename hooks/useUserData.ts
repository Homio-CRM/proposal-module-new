import { useEffect, useState, useRef } from 'react'
import { authService } from '@/lib/auth/authService'
import { userDataService } from '@/lib/auth/userDataService'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { dataService } from '@/lib/services/dataService'
import type { UserData, UseUserDataReturn } from '@/lib/types'

// Cache global para evitar múltiplas inicializações
let globalInitializationPromise: Promise<UserData | null> | null = null
let globalUserData: UserData | null = null
let globalLoading = true
let globalError: string | null = null

export default function useUserData(): UseUserDataReturn {
    const [userData, setUserData] = useState<UserData | null>(globalUserData)
    const [loading, setLoading] = useState(globalLoading)
    const [error, setError] = useState<string | null>(globalError)
    const hasInitialized = useRef(false)

    const fetchInitialData = async (userData: UserData) => {
        try {
            await dataService.fetchProposalsData(userData.companyId)
            await dataService.fetchAgencyConfig(userData.activeLocation)
        } catch (error) {
            console.error('Erro ao buscar dados iniciais:', error)
        }
    }

    async function initializeUserSession(cacheKey: string): Promise<void> {
        try {
            const cachedData = userCache.get<UserData>(cacheKey)
            if (cachedData) {
                setUserData(cachedData)
                setLoading(false)
                return
            }

            setError('Authentication required - no valid session found')
            setUserData(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            setUserData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (hasInitialized.current) {
            return
        }

        hasInitialized.current = true

        const handleAuthentication = async () => {
            // Se já temos dados globais, usar eles
            if (globalUserData) {
                setUserData(globalUserData)
                setLoading(false)
                return
            }

            // Se já está em processo de inicialização, aguardar
            if (globalInitializationPromise) {
                try {
                    const result = await globalInitializationPromise
                    setUserData(result)
                    setLoading(false)
                } catch (error) {
                    setError('Failed to get user data')
                    setLoading(false)
                }
                return
            }

            // Iniciar processo de autenticação global
            globalInitializationPromise = (async () => {
                try {
                    let userData: UserData

                    if (process.env.NODE_ENV === 'development') {
                        userData = {
                            userId: "oKD3wYXnvt2LJVvvtL9T",
                            companyId: "3PL31w5rI7KFAU9Hfd8Y",
                            role: "admin",
                            type: "agency",
                            activeLocation: "Ew4LzbKZmyOVYwv4iwDI",
                            userName: "Luan Paganucci",
                            email: "luan.paganucci@homio.com.br"
                        }
                        
                        await authService.initializeSession(userData)
                        await fetchInitialData(userData)
                    } else {
                        userData = await userDataService.getUserData()
                        await authService.initializeSession(userData)
                        await fetchInitialData(userData)
                    }

                    globalUserData = userData
                    globalLoading = false
                    globalError = null
                    
                    return userData
                } catch (error) {
                    globalError = 'Failed to get user data'
                    globalLoading = false
                    throw error
                }
            })()

            try {
                const result = await globalInitializationPromise
                setUserData(result)
                setLoading(false)
                setError(null)
            } catch (error) {
                setError('Failed to get user data')
                setLoading(false)
            }
        }

        handleAuthentication()
    }, [])

    return { userData, loading, error }
}