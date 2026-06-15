'use client'

import { useEffect } from 'react'
import Spinner from '@/components/ui/spinner'
import { openAdminOverview } from '@/lib/expert/switch-dashboard-view'

/** `/dashboard/admin` — switch to Admin view and show overview on `/dashboard`. */
export default function AdminDashboardRedirectPage() {
  useEffect(() => {
    void openAdminOverview().catch(() => {
      window.location.assign('/dashboard')
    })
  }, [])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size={28} />
    </div>
  )
}
