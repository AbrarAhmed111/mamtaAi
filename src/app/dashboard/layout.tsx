import type { ReactNode } from 'react'
import DashboardClientLayout from './DashboardClientLayout'
import { getOnboardingStatsForCurrentUser } from '@/lib/onboarding/stats-snapshot'
import { getSubscriptionSnapshotForCurrentUser } from '@/lib/subscription/snapshot'

type DashboardLayoutProps = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const [initialSubscription, initialOnboardingStats] = await Promise.all([
    getSubscriptionSnapshotForCurrentUser(),
    getOnboardingStatsForCurrentUser(),
  ])

  return (
    <DashboardClientLayout
      initialSubscription={initialSubscription}
      initialOnboardingStats={initialOnboardingStats}
    >
      {children}
    </DashboardClientLayout>
  )
}
