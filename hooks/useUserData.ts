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
            console.log('🔐 USER_DATA_HOOK - Iniciando inicialização de sessão de usuário')
            console.log('🔑 USER_DATA_HOOK - Cache key:', cacheKey)
            
            const cachedData = userCache.get<UserData>(cacheKey)
            if (cachedData) {
                console.log('✅ USER_DATA_HOOK - Dados encontrados no cache:', {
                    userId: cachedData.userId,
                    email: cachedData.email,
                    role: cachedData.role
                })
                setUserData(cachedData)
                setLoading(false)
                return
            }

            console.log('❌ USER_DATA_HOOK - Nenhuma sessão válida encontrada')
            setError('Authentication required - no valid session found')
            setUserData(null)
        } catch (err) {
            console.error('❌ USER_DATA_HOOK - Erro na inicialização de sessão:', err)
            console.error('❌ USER_DATA_HOOK - Stack trace:', err instanceof Error ? err.stack : 'No stack trace available')
            setError(err instanceof Error ? err.message : 'Unknown error')
            setUserData(null)
        } finally {
            console.log('🏁 USER_DATA_HOOK - Finalizando processo de inicialização')
            setLoading(false)
        }
    }

    useEffect(() => {
        const cacheKey = CACHE_KEYS.USER_SESSION
        console.log('🔍 USER_DATA_HOOK - Iniciando processo de autenticação')
        console.log('🔑 USER_DATA_HOOK - Cache key:', cacheKey)

        const handleAuthentication = async () => {
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ USER_DATA_HOOK - Modo desenvolvimento detectado')
                const mockData: UserData = {
                    userId: "oKD3wYXnvt2LJVvvtL9T",
                    companyId: "3PL31w5rI7KFAU9Hfd8Y",
                    role: "admin",
                    type: "agency",
                    activeLocation: "Ew4LzbKZmyOVYwv4iwDI",
                    userName: "Luan Paganucci",
                    email: "luan.paganucci@homio.com.br"
                }
                
                console.log('📊 USER_DATA_HOOK - Dados mock configurados:', JSON.stringify(mockData, null, 2))
                
                try {
                    console.log('🔐 USER_DATA_HOOK - Inicializando sessão com dados mock')
                    await authService.initializeSession(mockData)
                    console.log('✅ USER_DATA_HOOK - Sessão mock inicializada com sucesso')
                    
                    setUserData(mockData)
                    console.log('📊 USER_DATA_HOOK - UserData definido no estado')
                    
                    console.log('📡 USER_DATA_HOOK - Buscando dados iniciais')
                    await fetchInitialData(mockData)
                    console.log('✅ USER_DATA_HOOK - Dados iniciais carregados')
                } catch (error) {
                    console.error('❌ USER_DATA_HOOK - Erro ao inicializar sessão mock:', error)
                    setError('Failed to initialize session in development')
                }
                setLoading(false)
                return
            }

            console.log('🔍 USER_DATA_HOOK - Modo produção - verificando cache')
            userCache.clear()
            console.log('🗑️ USER_DATA_HOOK - Cache limpo')
            
            if (typeof window !== 'undefined') {
                localStorage.removeItem('sb-refresh-token')
                console.log('🗑️ USER_DATA_HOOK - Refresh token removido do localStorage')
            }

            const cachedData = userCache.get<UserData>(cacheKey)
            if (cachedData) {
                console.log('✅ USER_DATA_HOOK - Dados encontrados no cache:', {
                    userId: cachedData.userId,
                    email: cachedData.email,
                    role: cachedData.role
                })
                setUserData(cachedData)
                await fetchInitialData(cachedData)
                setLoading(false)
                return
            }

            console.log('🔍 USER_DATA_HOOK - Dados não encontrados no cache, inicializando sessão')
            await initializeUserSession(cacheKey)
        }

        handleAuthentication()
    }, [])

    return { userData, loading, error }
}
