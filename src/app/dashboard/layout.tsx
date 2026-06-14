import type { ReactNode } from 'react'
import DashboardClientLayout from './DashboardClientLayout'
import { getSubscriptionSnapshotForCurrentUser } from '@/lib/subscription/snapshot'

type DashboardLayoutProps = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const initialSubscription = await getSubscriptionSnapshotForCurrentUser()

  return (
    <DashboardClientLayout initialSubscription={initialSubscription}>
      {children}
    </DashboardClientLayout>
  )
}
