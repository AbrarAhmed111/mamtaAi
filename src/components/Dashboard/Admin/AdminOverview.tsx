'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Spinner from '@/components/ui/spinner'
import { AdminPageHeader, AdminSectionTitle, AdminStatCard } from './AdminUi'

type AdminStats = {
  platform: {
    totalUsers: number
    totalBabies: number
    recordingsThisWeek: number
    mrr: number
  }
  pendingExperts: number
  flaggedContent: number
  unresolvedErrors: number
  planBreakdown: Record<string, number>
  recentSignups: Array<{
    id: string
    fullName: string
    role: string
    accountType: string
    createdAt: string
    suspended: boolean
  }>
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/stats', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data.error || 'Failed to load admin stats')
          return
        }
        setStats(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center text-rose-800">
        {error || 'Unable to load admin overview'}
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Admin overview"
        description="Platform health, queues, and recent activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total users" value={stats.platform.totalUsers} href="/dashboard/admin/users" />
        <AdminStatCard label="Total babies" value={stats.platform.totalBabies} accent="purple" />
        <AdminStatCard
          label="Recordings (7d)"
          value={stats.platform.recordingsThisWeek}
          accent="emerald"
        />
        <AdminStatCard label="MRR (USD)" value={`$${stats.platform.mrr}`} accent="amber" href="/dashboard/admin/subscriptions" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminStatCard
          label="Pending experts"
          value={stats.pendingExperts}
          href="/dashboard/admin/experts"
          accent="purple"
        />
        <AdminStatCard
          label="Flagged content"
          value={stats.flaggedContent}
          href="/dashboard/admin/moderation"
          accent="rose"
        />
        <AdminStatCard
          label="Unresolved errors"
          value={stats.unresolvedErrors}
          href="/dashboard/admin/logs"
          accent="amber"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-pink-100/80 bg-white p-5 shadow-sm shadow-pink-100/20">
          <AdminSectionTitle>Subscription breakdown</AdminSectionTitle>
          <ul className="mt-4 space-y-2">
            {(['free', 'plus', 'pro'] as const).map(plan => (
              <li key={plan} className="flex items-center justify-between text-sm">
                <span className="capitalize text-gray-600">{plan}</span>
                <span className="font-semibold text-gray-900">{stats.planBreakdown[plan] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-pink-100/80 bg-white p-5 shadow-sm shadow-pink-100/20">
          <div className="flex items-center justify-between">
            <AdminSectionTitle>Recent signups</AdminSectionTitle>
            <Link href="/dashboard/admin/users" className="text-sm text-pink-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-pink-50">
            {stats.recentSignups.length === 0 ? (
              <li className="py-4 text-sm text-gray-500">No recent signups</li>
            ) : (
              stats.recentSignups.map(u => (
                <li key={u.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{u.fullName}</p>
                    <p className="text-gray-500">{u.accountType || u.role}</p>
                  </div>
                  <span className="text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
