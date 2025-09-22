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

            setError('Authentication required - no valid session found')
            setUserData(null)
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
            console.log('🔍 NODE_ENV:', process.env.NODE_ENV)
            
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ Modo desenvolvimento - usando dados mock')
                const mockData: UserData = {
                    userId: "oKD3wYXnvt2LJVvvtL9T",
                    companyId: "3PL31w5rI7KFAU9Hfd8Y",
                    role: "admin",
                    type: "agency",
                    activeLocation: "d8voPwkhJK7k7S5xjHcA",
                    userName: "Luan Paganucci",
                    email: "luan.paganucci@homio.com.br"
                }
                
                userCache.set(cacheKey, mockData, PERFORMANCE_CONFIG.CACHE_TTL.USER_SESSION)
                setUserData(mockData)
                setLoading(false)
                return
            }

            console.log('❌ Modo produção - limpando cache e exigindo autenticação')
            userCache.clear()
            
            if (typeof window !== 'undefined') {
                localStorage.removeItem('sb-refresh-token')
            }

            const cachedData = userCache.get<UserData>(cacheKey)
            console.log('🔍 Dados em cache após limpeza:', cachedData)
            if (cachedData) {
                console.log('⚠️ Dados em cache encontrados após limpeza:', cachedData)
                setUserData(cachedData)
                setLoading(false)
                return
            }

            console.log('🔐 Inicializando sessão - deve dar erro')
            await initializeUserSession(cacheKey)
        }

        handleAuthentication()
    }, [])

    return { userData, loading, error }
}
