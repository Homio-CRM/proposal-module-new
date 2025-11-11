'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { preferencesService } from '@/lib/services/preferencesService'
import { useUserDataContext } from '@/lib/contexts/UserDataContext'
import type { PreferencesPayload, PreferencesRecord } from '@/lib/types/preferences'

interface PreferencesContextValue {
  preferences: PreferencesRecord | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  update: (payload: PreferencesPayload) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { userData, loading: userLoading } = useUserDataContext()
  const [preferences, setPreferences] = useState<PreferencesRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locationId = userData?.activeLocation

  const loadPreferences = useCallback(async () => {
    if (!locationId) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await preferencesService.fetchPreferences(locationId)
      setPreferences(result)
    } catch {
      setError('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }, [locationId])

  useEffect(() => {
    if (!userLoading && locationId) {
      loadPreferences()
    }
  }, [userLoading, locationId, loadPreferences])

  const handleRefresh = useCallback(async () => {
    if (!locationId) {
      return
    }
    await loadPreferences()
  }, [locationId, loadPreferences])

  const handleUpdate = useCallback(
    async (payload: PreferencesPayload) => {
      if (!locationId) {
        throw new Error('Location not available')
      }

      setLoading(true)
      setError(null)

      try {
        const result = await preferencesService.updatePreferences(locationId, payload)
        setPreferences(result)
      } catch {
        setError('Failed to update preferences')
        throw new Error('Failed to update preferences')
      } finally {
        setLoading(false)
      }
    },
    [locationId]
  )

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        loading,
        error,
        refresh: handleRefresh,
        update: handleUpdate
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferencesContext(): PreferencesContextValue {
  const context = useContext(PreferencesContext)

  if (!context) {
    throw new Error('usePreferencesContext must be used within a PreferencesProvider')
  }

  return context
}

