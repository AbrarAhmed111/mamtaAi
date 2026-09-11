'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/components/ui/sonner'
import Spinner from '@/components/ui/spinner'
import Select from '@/components/ui/select'
import { AdminBadge, AdminEmptyState, AdminPageHeader, AdminTableShell } from './AdminUi'

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'plus', label: 'Plus' },
  { value: 'pro', label: 'Pro' },
]

type SubRow = {
  id: string
  userId: string
  userName: string
  status: string
  planSlug: string
  planName: string
  priceUsd: number
  currentPeriodEnd: string | null
}

export default function SubscriptionsTable() {
  const [items, setItems] = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscriptions', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to load subscriptions')
      setItems(data.subscriptions || [])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const overridePlan = async (id: string, planSlug: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Override failed')
      toast.success(`Plan updated to ${planSlug}`)
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Override failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Subscriptions"
        description="View subscriptions and apply manual plan overrides (syncs with Stripe when applicable)."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <AdminTableShell>
          {items.length === 0 ? (
            <AdminEmptyState message="No subscriptions found." />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-pink-100 bg-pink-50/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Period end</th>
                  <th className="px-4 py-3">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {items.map(s => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.userName}</td>
                    <td className="px-4 py-3 capitalize">
                      {s.planName || s.planSlug}{' '}
                      {s.priceUsd > 0 && (
                        <span className="text-gray-400">${s.priceUsd}/mo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge tone={s.status === 'active' ? 'green' : 'amber'}>{s.status}</AdminBadge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.currentPeriodEnd
                        ? new Date(s.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={s.planSlug}
                        disabled={busyId === s.id}
                        onChange={plan => void overridePlan(s.id, plan)}
                        options={PLAN_OPTIONS}
                        size="sm"
                        aria-label={`Plan for ${s.userName}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableShell>
      )}
    </div>
  )
}
