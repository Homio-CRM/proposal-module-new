import { PERFORMANCE_CONFIG } from '@/lib/config/performance'

interface CacheItem<T> {
    data: T
    timestamp: number
    ttl: number
}

class UserCache {
    private cache = new Map<string, CacheItem<unknown>>()
    private readonly DEFAULT_TTL = PERFORMANCE_CONFIG.CACHE_TTL.LISTINGS

    set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        })
    }

    get<T>(key: string): T | null {
        const item = this.cache.get(key)
        if (!item) {
            return null
        }

        const isExpired = Date.now() - item.timestamp > item.ttl
        if (isExpired) {
            this.cache.delete(key)
            return null
        }

        return item.data as T
    }

    delete(key: string): void {
        this.cache.delete(key)
    }

    clear(): void {
        this.cache.clear()
    }

    has(key: string): boolean {
        const hasKey = this.cache.has(key) && this.get(key) !== null
        return hasKey
    }

    debug(): void {
        for (const [key, item] of Array.from(this.cache.entries())) {
            const expired = Date.now() - item.timestamp > item.ttl
            if (expired) {
                this.cache.delete(key)
            }
        }
    }
}

export const userCache = new UserCache()

export const CACHE_KEYS = {
    MEDIA_ITEMS: 'media_items',
    USER_SESSION: 'user_session',
    USER_PROFILE: 'user_profile',
    LISTINGS: 'listings',
    CONDOMINIUMS: 'condominiums'
} as const
