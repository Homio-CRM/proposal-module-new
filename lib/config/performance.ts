export const PERFORMANCE_CONFIG = {
    CACHE_TTL: {
        USER_PROFILE: 10 * 60 * 1000,
        USER_SESSION: 15 * 60 * 1000,
        LISTINGS: 5 * 60 * 1000,
        CONDOMINIUMS: 5 * 60 * 1000,
        MEDIA_ITEMS: 10 * 60 * 1000,
    },

    DEBOUNCE_DELAY: {
        SEARCH: 300,
        FILTER: 500,
    },

    BATCH_SIZE: {
        LISTINGS: 25,
        CONDOMINIUMS: 20,
        MEDIA_ITEMS: 50,
    },

    RETRY_CONFIG: {
        MAX_RETRIES: 3,
        BACKOFF_MULTIPLIER: 2,
    },

    LOADING_STATES: {
        SKELETON_ROWS: 5,
    }
} as const

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        DECRYPT: '/api/decrypt-user-data',
        REFRESH: '/api/auth/refresh',
    },
    DATA: {
        LISTINGS: '/api/listings',
        CONDOMINIUMS: '/api/condominiums',
        MEDIA: '/api/media',
    },
    OPERATIONS: {
        GET_OPPORTUNITY: '/api/operations/opportunity',
        GET_CONTACT: '/api/operations/contact',
        GET_CUSTOM_FIELDS: '/api/operations/custom-fields',
    }
} as const
