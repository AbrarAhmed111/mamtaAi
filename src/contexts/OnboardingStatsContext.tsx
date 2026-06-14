'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { dashboardFetch } from '@/lib/session/client'
import type { OnboardingStatsSnapshot } from '@/lib/onboarding/stats-snapshot'

type OnboardingStatsState = OnboardingStatsSnapshot & {
  loading: boolean
  refresh: () => Promise<void>
}

const defaultStats: OnboardingStatsSnapshot = {
  hasBaby: false,
  hasRecording: false,
}

const OnboardingStatsContext = createContext<OnboardingStatsState | null>(null)

type OnboardingStatsProviderProps = {
  children: React.ReactNode
  initialStats?: OnboardingStatsSnapshot | null
}

export function OnboardingStatsProvider({
  children,
  initialStats = null,
}: OnboardingStatsProviderProps) {
  const [loading, setLoading] = useState(!initialStats)
  const [stats, setStats] = useState<OnboardingStatsSnapshot>(initialStats ?? defaultStats)

  const applyStats = useCallback((next: Partial<OnboardingStatsSnapshot>) => {
    setStats(prev => ({
      hasBaby: next.hasBaby ?? prev.hasBaby,
      hasRecording: next.hasRecording ?? prev.hasRecording,
    }))
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await dashboardFetch('/api/user/stats', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) return
      applyStats({
        hasBaby: Boolean(json?.hasBaby),
        hasRecording: Boolean(json?.hasRecording),
      })
    } finally {
      setLoading(false)
    }
  }, [applyStats])

  useEffect(() => {
    if (initialStats) return
    void refresh()
  }, [initialStats, refresh])

  const value = useMemo<OnboardingStatsState>(
    () => ({
      ...stats,
      loading,
      refresh,
    }),
    [stats, loading, refresh],
  )

  return (
    <OnboardingStatsContext.Provider value={value}>{children}</OnboardingStatsContext.Provider>
  )
}

export function useOnboardingStats(): OnboardingStatsState {
  const ctx = useContext(OnboardingStatsContext)
  if (!ctx) {
    throw new Error('useOnboardingStats must be used within OnboardingStatsProvider')
  }
  return ctx
}
