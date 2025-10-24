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
        const cacheKey = `${CACHE_KEYS.USER_SESSION}_${userData.userId}`
        this.sessionCacheKey = cacheKey

        const cachedSession = userCache.get<{ access_token: string; refresh_token: string; user: User | null }>(cacheKey)
        if (cachedSession && cachedSession.access_token) {
            return cachedSession
        }

        try {
            const loginResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })

            if (!loginResponse.ok) {
                const errorData = await loginResponse.json()
                throw new Error(errorData.error || 'Failed to authenticate')
            }

            const sessionData = await loginResponse.json()

            const supabaseClient = await getSupabase()
            const { error: sessionError } = await supabaseClient.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token
            })

            if (sessionError) {
                throw new Error(`Failed to set session: ${sessionError.message}`)
            }

            userCache.set(cacheKey, sessionData, PERFORMANCE_CONFIG.CACHE_TTL.USER_SESSION)

            if (typeof window !== 'undefined') {
                localStorage.setItem(REFRESH_TOKEN_KEY, sessionData.refresh_token)
            }

            return sessionData
        } catch (error) {
            console.error('Erro ao inicializar sessão:', error)
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
