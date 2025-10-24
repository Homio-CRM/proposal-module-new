import { useEffect, useState, useRef } from 'react'
import { authService } from '@/lib/auth/authService'
import { userDataService } from '@/lib/auth/userDataService'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { dataService } from '@/lib/services/dataService'
import type { UserData, UseUserDataReturn } from '@/lib/types'

export default function useUserData(): UseUserDataReturn {
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
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
        const cacheKey = CACHE_KEYS.USER_SESSION

        const handleAuthentication = async () => {
            if (process.env.NODE_ENV === 'development') {
                const mockData: UserData = {
                    userId: "oKD3wYXnvt2LJVvvtL9T",
                    companyId: "3PL31w5rI7KFAU9Hfd8Y",
                    role: "admin",
                    type: "agency",
                    activeLocation: "Ew4LzbKZmyOVYwv4iwDI",
                    userName: "Luan Paganucci",
                    email: "luan.paganucci@homio.com.br"
                }
                
                try {
                    await authService.initializeSession(mockData)
                    setUserData(mockData)
                    await fetchInitialData(mockData)
                } catch (error) {
                    setError('Failed to initialize mock session')
                }
            } else {
                try {
                    const realUserData = await userDataService.getUserData()
                    await authService.initializeSession(realUserData)
                    setUserData(realUserData)
                    await fetchInitialData(realUserData)
                } catch (error) {
                    setError('Failed to get user data from parent window')
                }
            }
            
            setLoading(false)
        }

        handleAuthentication()
    }, [])

    return { userData, loading, error }
}