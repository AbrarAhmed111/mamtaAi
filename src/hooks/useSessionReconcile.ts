'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import { useSubscription } from '@/hooks/useSubscription'
import {
  dashboardFetch,
  registerSessionInvalidHandler,
  snapshotFromProfile,
  type SessionAccessSnapshot,
} from '@/lib/session/client'
import {
  accessChangeMessage,
  detectAccessChange,
  type SessionInvalidCode,
  type SessionStatusResponse,
} from '@/lib/session/types'

const RECONCILE_INTERVAL_MS = 90_000

type UseSessionReconcileOptions = {
  enabled: boolean
  profile: {
    role?: string | null
    is_expert?: boolean | null
    is_verified?: boolean | null
    metadata?: unknown
  } | null | undefined
  refreshUser: () => Promise<unknown>
  signOut: () => Promise<void>
}

export function useSessionReconcile({
  enabled,
  profile,
  refreshUser,
  signOut,
}: UseSessionReconcileOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const subscription = useSubscription()
  const accessRef = useRef<SessionAccessSnapshot | null>(null)
  const subscriptionSlugRef = useRef<string | null>(null)
  const handlingInvalidRef = useRef(false)

  useEffect(() => {
    if (profile) {
      accessRef.current = snapshotFromProfile(profile)
    }
  }, [profile])

  const redirectForInvalid = useCallback(
    async (code: SessionInvalidCode) => {
      if (handlingInvalidRef.current) return
      handlingInvalidRef.current = true
      try {
        if (code === 'account_suspended') {
          await signOut()
          router.replace('/account-suspended')
          return
        }
        await signOut()
        router.replace(code === 'account_deleted' ? '/welcome?reason=account_deleted' : '/welcome')
      } finally {
        setTimeout(() => {
          handlingInvalidRef.current = false
        }, 3000)
      }
    },
    [router, signOut],
  )

  const redirectIfViewForbidden = useCallback(
    (access: SessionAccessSnapshot) => {
      if (pathname?.startsWith('/dashboard/admin') && access.role !== 'admin') {
        router.replace('/dashboard')
        return true
      }
      if (pathname?.startsWith('/dashboard/expert/') && !access.isExpert) {
        router.replace('/dashboard')
        return true
      }
      return false
    },
    [pathname, router],
  )

  const reconcile = useCallback(async () => {
    if (!enabled) return

    const res = await dashboardFetch('/api/session/status', { cache: 'no-store' })
    const data = (await res.json().catch(() => ({}))) as SessionStatusResponse

    if (!data.ok) {
      await redirectForInvalid(data.code)
      return
    }

    const previous = accessRef.current
    const change = detectAccessChange(previous, data.access)
    accessRef.current = data.access

    if (change) {
      await refreshUser()
      toast.info(accessChangeMessage(change))
      redirectIfViewForbidden(data.access)
    }

    if (
      data.subscriptionSlug &&
      subscriptionSlugRef.current &&
      data.subscriptionSlug !== subscriptionSlugRef.current
    ) {
      await subscription.refresh()
      toast.info('Your subscription plan was updated.')
    }
    subscriptionSlugRef.current = data.subscriptionSlug
  }, [enabled, redirectForInvalid, refreshUser, redirectIfViewForbidden, subscription])

  useEffect(() => {
    if (!enabled) return

    registerSessionInvalidHandler(code => {
      void redirectForInvalid(code)
    })
    return () => registerSessionInvalidHandler(null)
  }, [enabled, redirectForInvalid])

  useEffect(() => {
    if (!enabled) return

    void reconcile()

    const interval = window.setInterval(() => {
      void reconcile()
    }, RECONCILE_INTERVAL_MS)

    const onFocus = () => {
      void reconcile()
    }
    window.addEventListener('focus', onFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [enabled, reconcile])
}
