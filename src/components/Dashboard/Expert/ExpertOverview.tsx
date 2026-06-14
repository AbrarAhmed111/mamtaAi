'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaUserMd, FaBook, FaEye, FaPen, FaExternalLinkAlt } from 'react-icons/fa'
import Spinner from '@/components/ui/spinner'
import ExpertRequestStatusCard, {
  type ExpertApplicationSummary,
} from '@/components/Dashboard/Expert/ExpertRequestStatusCard'

type DashboardStats = {
  stats: {
    profileViews: number
    articlesPublished: number
    communityReplies: number
  }
}

type ApplyPayload = {
  status: 'none' | 'pending' | 'approved' | 'rejected'
  application: ExpertApplicationSummary | null
  canApply: boolean
  reapplyAt: string | null
}

export default function ExpertOverview() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [applyState, setApplyState] = useState<ApplyPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const [dashboardRes, applyRes] = await Promise.all([
          fetch('/api/experts/dashboard', { cache: 'no-store' }),
          fetch('/api/experts/apply', { cache: 'no-store' }),
        ])

        const applyJson = await applyRes.json().catch(() => ({}))
        if (applyRes.ok) {
          setApplyState({
            status: applyJson.status || 'none',
            application: applyJson.application ?? null,
            canApply: Boolean(applyJson.canApply),
            reapplyAt: applyJson.reapplyAt ?? null,
          })
        }

        const dashboardJson = await dashboardRes.json().catch(() => ({}))
        if (!dashboardRes.ok) {
          throw new Error(dashboardJson.error || 'Failed to load overview')
        }
        setData(dashboardJson)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load overview')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center text-rose-800">
        {error || 'Unable to load expert overview'}
      </div>
    )
  }

  const { stats } = data
  const requestStatus = applyState?.status ?? 'approved'

  return (
    <div className="space-y-6">
      <ExpertRequestStatusCard
        status={requestStatus === 'none' ? 'approved' : requestStatus}
        application={applyState?.application}
        canApply={applyState?.canApply}
        reapplyAt={applyState?.reapplyAt}
      />

      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Expert overview
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your public profile, content, and community presence.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Profile views', value: stats.profileViews, icon: FaEye },
          { label: 'Articles published', value: stats.articlesPublished, icon: FaBook },
          { label: 'Community replies', value: stats.communityReplies, icon: FaUserMd },
        ].map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm shadow-pink-100/40"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
                <Icon className="text-pink-500" />
              </div>
              <p className="mt-3 text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-6">
        <h2 className="text-lg font-bold text-gray-900">Quick actions</h2>
        <div className="mt-4 flex flex-col gap-3 sm:max-w-md">
          <Link
            href="/dashboard/expert/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium text-pink-700 hover:bg-pink-50"
          >
            <FaPen /> Edit expert profile
          </Link>
          <Link
            href="/dashboard/expert/articles"
            className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium text-pink-700 hover:bg-pink-50"
          >
            <FaBook /> Write an article
          </Link>
          <Link
            href="/dashboard/experts"
            className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-medium text-pink-700 hover:bg-pink-50"
          >
            <FaExternalLinkAlt /> View directory listing
          </Link>
        </div>
      </div>
    </div>
  )
}
