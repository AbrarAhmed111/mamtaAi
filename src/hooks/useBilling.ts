'use client'

import { useCallback, useState } from 'react'
import type { PlanSlug } from '@/lib/subscription/types'

export function useBilling() {
  const [loadingPlan, setLoadingPlan] = useState<PlanSlug | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const startCheckout = useCallback(async (planSlug: 'plus' | 'pro', couponCode?: string | null) => {
    setLoadingPlan(planSlug)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug, couponCode: couponCode?.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Could not start checkout')
      }
      if (data.url) {
        window.location.href = data.url as string
        return
      }
      throw new Error('No checkout URL returned')
    } finally {
      setLoadingPlan(null)
    }
  }, [])

  const openPortal = useCallback(async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Could not open billing portal')
      }
      if (data.url) {
        window.location.href = data.url as string
        return
      }
      throw new Error('No portal URL returned')
    } finally {
      setPortalLoading(false)
    }
  }, [])

  return {
    loadingPlan,
    portalLoading,
    isCheckoutLoading: loadingPlan !== null,
    startCheckout,
    openPortal,
  }
}
