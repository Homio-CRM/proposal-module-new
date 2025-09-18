export interface ApiResponse<T = unknown> {
    data?: T
    error?: string
    message?: string
}

export interface PaginationParams {
    page?: number
    limit?: number
    offset?: number
}

export interface SortParams {
    field: string
    direction: 'asc' | 'desc'
}

export interface FilterParams {
    [key: string]: unknown
}
