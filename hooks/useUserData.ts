import { useEffect, useState } from 'react'
import { authService } from '@/lib/auth/authService'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { PERFORMANCE_CONFIG } from '@/lib/config/performance'
import type { UserData, UseUserDataReturn } from '@/lib/types'

export default function useUserData(): UseUserDataReturn {
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function initializeUserSession(cacheKey: string): Promise<void> {
        try {
            const cachedData = userCache.get<UserData>(cacheKey)
            if (cachedData) {
                setUserData(cachedData)
                setLoading(false)
                return
            }

            const response = await fetch('/api/decrypt-user-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ encryptedData: 'mock_encrypted_data' })
            })

            if (!response.ok) {
                throw new Error('Failed to decrypt user data')
            }

            const userData = await response.json()
            
            await authService.initializeSession(userData)
            userCache.set(cacheKey, userData, PERFORMANCE_CONFIG.CACHE_TTL.USER_SESSION)
            setUserData(userData)
        } catch (err) {
            console.error('❌ Erro no fluxo de autenticação:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
            setUserData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const cacheKey = CACHE_KEYS.USER_SESSION

        const handleAuthentication = async () => {
            if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
                const mockData: UserData = {
                    userId: "mock_user_id_123",
                    companyId: "mock_company_id_456",
                    role: "admin",
                    type: "agency",
                    activeLocation: "mock_location_id_789",
                    userName: "Mock User",
                    email: "mock.user@example.com"
                }
                
                userCache.set(cacheKey, mockData, PERFORMANCE_CONFIG.CACHE_TTL.USER_SESSION)
                setUserData(mockData)
                setLoading(false)
                return
            }

            const cachedData = userCache.get<UserData>(cacheKey)
            if (cachedData) {
                setUserData(cachedData)
                setLoading(false)
                return
            }

            await initializeUserSession(cacheKey)
        }

        handleAuthentication()
    }, [])

    return { userData, loading, error }
}
