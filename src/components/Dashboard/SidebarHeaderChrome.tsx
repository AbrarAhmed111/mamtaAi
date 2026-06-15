'use client'

import PlanHeaderBadge from '@/components/subscription/PlanHeaderBadge'
import AdminHeaderBadge from '@/components/Dashboard/Admin/AdminHeaderBadge'
import AdminViewSwitcher from '@/components/Dashboard/Admin/AdminViewSwitcher'
import ExpertViewSwitcher from '@/components/Dashboard/Expert/ExpertViewSwitcher'
import type { ActiveViewPreference, AdminDashboardView } from '@/lib/expert/constants'

type SidebarHeaderChromeProps = {
  showPlanBadge: boolean
  showAdminBadge: boolean
  adminAccount: boolean
  verifiedExpert: boolean
  adminViewPreference: AdminDashboardView
  expertViewPreference: ActiveViewPreference
}

/** Plan / admin badges and view switcher — mobile sidebar only (`lg:hidden`). */
export default function SidebarHeaderChrome({
  showPlanBadge,
  showAdminBadge,
  adminAccount,
  verifiedExpert,
  adminViewPreference,
  expertViewPreference,
}: SidebarHeaderChromeProps) {
  const hasViewSwitcher = adminAccount || verifiedExpert
  if (!showPlanBadge && !showAdminBadge && !hasViewSwitcher) return null

  return (
    <div className="mt-4 flex flex-col gap-2.5 border-b border-pink-100/80 pb-4 lg:hidden">
      {(showAdminBadge || showPlanBadge) && (
        <div className="flex flex-wrap items-center gap-2">
          {showAdminBadge ? <AdminHeaderBadge /> : null}
          {showPlanBadge ? <PlanHeaderBadge /> : null}
        </div>
      )}
      {adminAccount ? (
        <AdminViewSwitcher activeView={adminViewPreference} placement="panel" />
      ) : verifiedExpert ? (
        <ExpertViewSwitcher activeView={expertViewPreference} placement="panel" />
      ) : null}
    </div>
  )
}
