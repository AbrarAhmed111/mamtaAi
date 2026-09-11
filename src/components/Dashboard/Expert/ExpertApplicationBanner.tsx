'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaClock, FaTimesCircle, FaUserMd } from 'react-icons/fa'
import { formatReapplyCountdown } from '@/lib/expert/applications'

type ApplicationState = {
  status: 'none' | 'pending' | 'approved' | 'rejected'
  reapplyAt?: string | null
  applyBlockedReason?: string | null
}

export default function ExpertApplicationBanner() {
  const [state, setState] = useState<ApplicationState | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/experts/apply', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return
        setState({
          status: data.status,
          reapplyAt: data.reapplyAt,
          applyBlockedReason: data.applyBlockedReason,
        })
      } catch {
        // ignore
      }
    })()
  }, [])

  if (!state || state.status === 'none' || state.status === 'approved') return null

  if (state.status === 'pending') {
    return (
      <div className="mb-4 rounded-2xl border border-pink-100/80 bg-gradient-to-r from-pink-50 via-rose-50 to-white px-4 py-4 shadow-sm shadow-pink-100/20 sm:px-5">
        <div className="flex flex-wrap items-start gap-3">
          <FaClock className="mt-0.5 shrink-0 text-pink-600" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">Your expert documents are under review</p>
            <p className="mt-1 text-sm text-gray-600">
              Our team is reviewing your application. You can continue using MumtaAI as a parent while you
              wait — we&apos;ll notify you by email and in-app when a decision is made.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const countdown = state.reapplyAt ? formatReapplyCountdown(state.reapplyAt) : null
  const canReapply = !state.reapplyAt || new Date(state.reapplyAt).getTime() <= Date.now()

  return (
    <div className="mb-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start gap-3">
        <FaTimesCircle className="mt-0.5 shrink-0 text-rose-600" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-rose-900">Your expert application was not approved</p>
          <p className="mt-1 text-sm text-rose-800/90">
            {canReapply
              ? 'You may submit a new application when ready.'
              : countdown
                ? `Please apply again in ${countdown}, or contact support if you have questions.`
                : 'Please contact support if you have questions.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {canReapply ? (
              <Link
                href="/dashboard/expert-application"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700"
              >
                <FaUserMd className="text-xs" />
                Re-apply as expert
              </Link>
            ) : null}
            <Link
              href="/dashboard/settings?tab=professional"
              className="inline-flex items-center rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Professional settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
