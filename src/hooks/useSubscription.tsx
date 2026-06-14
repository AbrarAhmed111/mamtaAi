'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { dashboardFetch } from '@/lib/session/client'
import type { PlanLimitations, PlanSlug, UsageStats } from '@/lib/subscription/types'
import PlanLimitModal from '@/components/subscription/PlanLimitModal'
import { registerPlanLimitHandler } from '@/lib/subscription/plan-limit-client'

export type SubscriptionMeter = {
  used: number
  max: number | null
  label: string
} | null

export type SubscriptionState = {
  loading: boolean
  slug: PlanSlug
  planName: string
  limitations: PlanLimitations
  usage: UsageStats
  showUpsellBanners: boolean
  meters: {
    recordings: SubscriptionMeter
    activities: SubscriptionMeter
    exports: SubscriptionMeter
  }
  refresh: () => Promise<void>
  showPlanLimitModal: (payload: PlanLimitApiError) => void
  closePlanLimitModal: () => void
  handlePlanLimit: (data: unknown) => boolean
}

const SubscriptionContext = createContext<SubscriptionState | null>(null)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState<PlanSlug>('free')
  const [planName, setPlanName] = useState('Free')
  const [limitations, setLimitations] = useState<PlanLimitations>({} as PlanLimitations)
  const [usage, setUsage] = useState<UsageStats>({ period: '' })
  const [showUpsellBanners, setShowUpsellBanners] = useState(true)
  const [meters, setMeters] = useState<SubscriptionState['meters']>({
    recordings: null,
    activities: null,
    exports: null,
  })
  const [planLimitPayload, setPlanLimitPayload] = useState<PlanLimitApiError | null>(null)
  const [planLimitOpen, setPlanLimitOpen] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await dashboardFetch('/api/subscription', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return
      setSlug((data?.plan?.slug as PlanSlug) || 'free')
      setPlanName(data?.plan?.name || 'Free')
      setLimitations(data?.plan?.limitations || {})
      setUsage(data?.usage || { period: '' })
      setShowUpsellBanners(Boolean(data?.plan?.showUpsellBanners))
      setMeters({
        recordings: data?.meters?.recordings ?? null,
        activities: data?.meters?.activities ?? null,
        exports: data?.meters?.exports ?? null,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const showPlanLimitModal = useCallback((payload: PlanLimitApiError) => {
    setPlanLimitPayload(payload)
    setPlanLimitOpen(true)
  }, [])

  useEffect(() => {
    registerPlanLimitHandler(showPlanLimitModal)
    return () => registerPlanLimitHandler(null)
  }, [showPlanLimitModal])

  const closePlanLimitModal = useCallback(() => {
    setPlanLimitOpen(false)
  }, [])

  const handlePlanLimit = useCallback(
    (data: unknown): boolean => {
      if (!isPlanLimitError(data)) return false
      showPlanLimitModal(data)
      return true
    },
    [showPlanLimitModal],
  )

  const value = useMemo(
    () => ({
      loading,
      slug,
      planName,
      limitations,
      usage,
      showUpsellBanners,
      meters,
      refresh,
      showPlanLimitModal,
      closePlanLimitModal,
      handlePlanLimit,
    }),
    [
      loading,
      slug,
      planName,
      limitations,
      usage,
      showUpsellBanners,
      meters,
      refresh,
      showPlanLimitModal,
      closePlanLimitModal,
      handlePlanLimit,
    ],
  )

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <PlanLimitModal
        open={planLimitOpen}
        payload={planLimitPayload}
        currentPlanName={planName}
        onClose={closePlanLimitModal}
      />
    </SubscriptionContext.Provider>
  )
}

export function useSubscription(): SubscriptionState {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider')
  }
  return ctx
}

/** Use anywhere in the dashboard to open the upgrade modal on plan limit API errors. */
export function usePlanLimit() {
  const { handlePlanLimit } = useSubscription()
  return handlePlanLimit
}

export type PlanLimitApiError = {
  error: 'PLAN_LIMIT_REACHED'
  message: string
  upgradeRequired?: boolean
  recommendedPlan?: PlanSlug
  code?: string
  current?: number
  max?: number | null
}

export function isPlanLimitError(data: unknown): data is PlanLimitApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as PlanLimitApiError).error === 'PLAN_LIMIT_REACHED'
  )
}

/** @deprecated Prefer `usePlanLimit()` inside React components. */
export function handlePlanLimitResponse(
  data: unknown,
  onUpgrade?: (recommended?: PlanSlug) => void,
): boolean {
  if (!isPlanLimitError(data)) return false
  if (onUpgrade) {
    onUpgrade(data.recommendedPlan)
    return true
  }
  if (typeof window !== 'undefined') {
    const go = window.confirm(`${data.message}\n\nView plans now?`)
    if (go) window.location.href = '/pricing'
  }
  return true
}
