import { getSupabase } from '@/lib/supabaseClient'
import { userCache, CACHE_KEYS } from '@/lib/cache/userCache'
import { PERFORMANCE_CONFIG } from '@/lib/config/performance'
import type { UserData } from '@/lib/types/core'
import type { User } from '@supabase/supabase-js'

const REFRESH_TOKEN_KEY = 'sb-refresh-token'

export class AuthService {
    private static instance: AuthService
    private sessionCacheKey: string | null = null

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService()
        }
        return AuthService.instance
    }

    async initializeSession(userData: UserData): Promise<{ access_token: string; refresh_token: string; user: User | null }> {
        console.log('🔐 AUTH_SERVICE - Iniciando inicialização de sessão')
        console.log('📊 AUTH_SERVICE - Dados do usuário:', {
            userId: userData.userId,
            email: userData.email,
            role: userData.role,
            type: userData.type,
            activeLocation: userData.activeLocation,
            userName: userData.userName,
            companyId: userData.companyId
        })
        
        const cacheKey = `${CACHE_KEYS.USER_SESSION}_${userData.userId}`
        this.sessionCacheKey = cacheKey
        console.log('🔑 AUTH_SERVICE - Cache key gerada:', cacheKey)

        const cachedSession = userCache.get<{ access_token: string; refresh_token: string; user: User | null }>(cacheKey)
        if (cachedSession && cachedSession.access_token) {
            console.log('✅ AUTH_SERVICE - Sessão encontrada no cache')
            return cachedSession
        }

        console.log('🔍 AUTH_SERVICE - Sessão não encontrada no cache, fazendo chamada para API')

        try {
            console.log('📡 AUTH_SERVICE - Fazendo chamada para /api/auth/login')
            const loginResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })

            console.log('📡 AUTH_SERVICE - Response status:', loginResponse.status)
            console.log('📡 AUTH_SERVICE - Response ok:', loginResponse.ok)

            if (!loginResponse.ok) {
                const errorData = await loginResponse.json()
                console.error('❌ AUTH_SERVICE - Erro na resposta da API:', errorData)
                throw new Error(errorData.error || 'Failed to authenticate')
            }

            const sessionData = await loginResponse.json()
            console.log('✅ AUTH_SERVICE - Dados da sessão recebidos:', {
                hasAccessToken: !!sessionData.access_token,
                hasRefreshToken: !!sessionData.refresh_token,
                hasUser: !!sessionData.user,
                accessTokenPreview: sessionData.access_token ? sessionData.access_token.substring(0, 20) + '...' : 'N/A',
                refreshTokenPreview: sessionData.refresh_token ? sessionData.refresh_token.substring(0, 20) + '...' : 'N/A'
            })

            console.log('🔐 AUTH_SERVICE - Configurando sessão no Supabase')
            const supabaseClient = await getSupabase()
            const { error: sessionError } = await supabaseClient.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token
            })

            if (sessionError) {
                console.error('❌ AUTH_SERVICE - Erro ao configurar sessão no Supabase:', sessionError)
                throw new Error(`Failed to set session: ${sessionError.message}`)
            }

            console.log('✅ AUTH_SERVICE - Sessão configurada com sucesso no Supabase')

            console.log('💾 AUTH_SERVICE - Salvando sessão no cache')
            userCache.set(cacheKey, sessionData, PERFORMANCE_CONFIG.CACHE_TTL.USER_SESSION)

            if (typeof window !== 'undefined') {
                console.log('💾 AUTH_SERVICE - Salvando refresh token no localStorage')
                localStorage.setItem(REFRESH_TOKEN_KEY, sessionData.refresh_token)
            }

            console.log('✅ AUTH_SERVICE - Sessão inicializada com sucesso')
            return sessionData
        } catch (error) {
            console.error('❌ AUTH_SERVICE - Erro ao inicializar sessão:', error)
            console.error('❌ AUTH_SERVICE - Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
            throw error
        }
    }

    async getUserProfile(userId: string): Promise<{ id: string; [key: string]: unknown } | null> {
        const cacheKey = `${CACHE_KEYS.USER_PROFILE}_${userId}`
        const cachedProfile = userCache.get<{ id: string; [key: string]: unknown }>(cacheKey)

        if (cachedProfile && cachedProfile.id) {
            return cachedProfile
        }

        const supabaseClient = await getSupabase()
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            throw error
        }

        if (!profile) {
            return null
        }

        userCache.set(cacheKey, profile, PERFORMANCE_CONFIG.CACHE_TTL.USER_PROFILE)
        return profile
    }

    async refreshSession(): Promise<void> {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null

        if (!storedRefreshToken) {
            const supabaseClient = await getSupabase()
            const { data: { session }, error } = await supabaseClient.auth.getSession()
            if (error || !session?.refresh_token) {
                throw new Error('No active session or refresh token found to refresh')
            }
            if (session.refresh_token) {
                localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token)
            }
        }

        if (!storedRefreshToken) {
            throw new Error('No refresh token available')
        }

        const supabaseClient = await getSupabase()
        const { data: { session: newSession }, error: refreshError } = await supabaseClient.auth.refreshSession({
            refresh_token: storedRefreshToken
        })

        if (refreshError) {
            if (refreshError.message.includes('Invalid refresh token')) {
                localStorage.removeItem(REFRESH_TOKEN_KEY)
            }
            throw refreshError
        }

        if (this.sessionCacheKey && newSession) {
            userCache.set(this.sessionCacheKey, {
                access_token: newSession.access_token,
                refresh_token: newSession.refresh_token,
                user: newSession.user
            }, PERFORMANCE_CONFIG.CACHE_TTL.USER_SESSION)

            if (typeof window !== 'undefined') {
                localStorage.setItem(REFRESH_TOKEN_KEY, newSession.refresh_token)
            }
        }
    }

    async logout(): Promise<void> {
        const supabaseClient = await getSupabase()
        await supabaseClient.auth.signOut()
        userCache.clear()
        this.sessionCacheKey = null
        if (typeof window !== 'undefined') {
            localStorage.removeItem(REFRESH_TOKEN_KEY)
        }
    }

    async isSessionValid(): Promise<boolean> {
        try {
            if (this.sessionCacheKey && userCache.has(this.sessionCacheKey)) {
                return true
            }

            const supabaseClient = await getSupabase()
            const { data: { session }, error } = await supabaseClient.auth.getSession()
            if (session && !error) {
                if (this.sessionCacheKey) {
                    userCache.set(this.sessionCacheKey, {
                        access_token: session.access_token,
                        refresh_token: session.refresh_token,
                        user: session.user
                    }, PERFORMANCE_CONFIG.CACHE_TTL.USER_SESSION)
                }
                return true
            }
            return false
        } catch (error) {
            console.error('Erro ao verificar sessão:', error)
            return false
        }
    }

    async ensureSession(userData?: UserData): Promise<boolean> {
        try {
            const isValid = await this.isSessionValid()
            if (isValid) {
                return true
            }

            if (userData) {
                await this.initializeSession(userData)
                const isNewSessionValid = await this.isSessionValid()
                if (isNewSessionValid) {
                    return true
                }
            }

            return false
        } catch (error) {
            console.error('Erro ao garantir sessão:', error)
            return false
        }
    }
}

export const authService = AuthService.getInstance()
