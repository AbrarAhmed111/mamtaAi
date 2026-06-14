'use client'

import { useAuth } from '@/lib/supabase/context'
import { useSessionReconcile } from '@/hooks/useSessionReconcile'

/** Polls live profile/subscription state and handles mid-session access changes */
export default function DashboardSessionReconcile() {
  const { user, refreshUser, signOut } = useAuth()

  useSessionReconcile({
    enabled: Boolean(user),
    profile: user?.profile ?? null,
    refreshUser,
    signOut,
  })

  return null
}
