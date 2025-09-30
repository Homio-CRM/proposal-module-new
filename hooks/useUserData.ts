import { useEffect, useState } from 'react'
import { authService } from '@/lib/auth/authService'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { dataService } from '@/lib/services/dataService'
import type { UserData, UseUserDataReturn } from '@/lib/types'

export default function useUserData(): UseUserDataReturn {
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
                } catch {
                    setError('Failed to initialize session in development')
                }
                setLoading(false)
                return
            }

            userCache.clear()
            
            if (typeof window !== 'undefined') {
                localStorage.removeItem('sb-refresh-token')
            }

            const cachedData = userCache.get<UserData>(cacheKey)
            if (cachedData) {
                setUserData(cachedData)
                await fetchInitialData(cachedData)
                setLoading(false)
                return
            }

            await initializeUserSession(cacheKey)
        }

        handleAuthentication()
    }, [])

    return { userData, loading, error }
}
