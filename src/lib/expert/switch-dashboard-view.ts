import type { AdminDashboardView } from '@/lib/expert/constants'

/** Persist admin dashboard view preference (admin accounts only). */
export async function switchAdminDashboardView(view: AdminDashboardView): Promise<void> {
  const res = await fetch('/api/profile/active-view', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dashboard_view: view }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to switch view')
  }
}

/** Switch to admin overview (`/dashboard` + Admin view) with a full reload so session metadata updates. */
export async function openAdminOverview(): Promise<void> {
  await switchAdminDashboardView('admin')
  window.location.assign('/dashboard')
}
