'use client'

import Link from 'next/link'
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaUserMd,
  FaFileAlt,
} from 'react-icons/fa'
import { formatReapplyCountdown } from '@/lib/expert/applications'

export type ExpertApplicationSummary = {
  id: string
  specialization: string
  professionalTitle: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt?: string | null
  rejectionReason?: string | null
}

type ExpertRequestStatusCardProps = {
  status: 'none' | 'pending' | 'approved' | 'rejected'
  application?: ExpertApplicationSummary | null
  canApply?: boolean
  reapplyAt?: string | null
  compact?: boolean
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ExpertRequestStatusCard({
  status,
  application,
  canApply = true,
  reapplyAt,
  compact = false,
}: ExpertRequestStatusCardProps) {
  if (status === 'none') return null

  const submittedOn = formatWhen(application?.createdAt)
  const reviewedOn = formatWhen(application?.reviewedAt)
  const countdown = reapplyAt ? formatReapplyCountdown(reapplyAt) : null
  const canReapplyNow = status === 'rejected' && canApply

  const statusConfig = {
    pending: {
      label: 'Under review',
      icon: FaClock,
      border: 'border-pink-100/80',
      bg: 'bg-gradient-to-br from-pink-50 via-rose-50/90 to-white',
      badge: 'bg-pink-100 text-pink-700',
      title: 'text-gray-900',
      body: 'text-gray-600',
      hint: 'text-pink-600/90',
    },
    approved: {
      label: 'Approved',
      icon: FaCheckCircle,
      border: 'border-pink-100/80',
      bg: 'bg-gradient-to-br from-pink-50 via-rose-50/90 to-white',
      badge: 'bg-pink-100 text-pink-700',
      title: 'text-gray-900',
      body: 'text-gray-600',
      hint: 'text-gray-500',
    },
    rejected: {
      label: 'Not approved',
      icon: FaTimesCircle,
      border: 'border-pink-100/80',
      bg: 'bg-gradient-to-br from-rose-50 via-pink-50/90 to-white',
      badge: 'bg-rose-100 text-rose-700',
      title: 'text-gray-900',
      body: 'text-gray-600',
      hint: 'text-gray-500',
    },
  } as const

  const cfg = statusConfig[status]
  const Icon = cfg.icon

  return (
    <section
      className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 shadow-sm shadow-pink-100/30 sm:p-6 ${compact ? '' : 'mb-6'}`}
      aria-labelledby="expert-request-status-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="expert-request-status-heading"
            className="text-sm font-semibold uppercase tracking-wide text-gray-500"
          >
            Request status
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.badge}`}
            >
              <Icon className="text-[10px]" />
              {cfg.label}
            </span>
            {application?.specialization ? (
              <span className="text-xs font-medium text-gray-600">{application.specialization}</span>
            ) : null}
          </div>
        </div>
        {application?.professionalTitle ? (
          <p className="text-sm font-medium text-gray-700">{application.professionalTitle}</p>
        ) : null}
      </div>

      <div className={`mt-4 space-y-2 text-sm ${cfg.body}`}>
        {status === 'pending' && (
          <>
            <p className={`font-medium ${cfg.title}`}>
              Your expert documents are under review
            </p>
            <p>
              Our team is verifying your credentials. You can keep using MamtaAI as a parent while
              you wait — we&apos;ll notify you by email and in-app when a decision is made.
            </p>
            <p className={`text-xs ${cfg.hint}`}>Typical review time: 1–3 business days.</p>
          </>
        )}

        {status === 'approved' && (
          <>
            <p className={`font-medium ${cfg.title}`}>You are a verified expert</p>
            <p>
              Your application was approved. Switch between Parent and Expert views anytime from the
              header, and manage your public listing below.
            </p>
          </>
        )}

        {status === 'rejected' && (
          <>
            <p className={`font-medium ${cfg.title}`}>
              Your expert application was not approved
            </p>
            {application?.rejectionReason ? (
              <p>
                <span className="font-medium">Reason:</span> {application.rejectionReason}
              </p>
            ) : null}
            <p>
              {canReapplyNow
                ? 'You may submit a new application when ready.'
                : countdown
                  ? `Please apply again in ${countdown}, or contact support if you have questions.`
                  : 'Please contact support if you have questions.'}
            </p>
          </>
        )}
      </div>

      {(submittedOn || reviewedOn) && (
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
          {submittedOn ? (
            <div className="flex gap-1.5">
              <dt className="font-medium">Submitted</dt>
              <dd>{submittedOn}</dd>
            </div>
          ) : null}
          {reviewedOn ? (
            <div className="flex gap-1.5">
              <dt className="font-medium">{status === 'approved' ? 'Approved' : 'Reviewed'}</dt>
              <dd>{reviewedOn}</dd>
            </div>
          ) : null}
        </dl>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {status === 'approved' && (
          <>
            <Link
              href="/dashboard/expert/profile"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700"
            >
              <FaUserMd className="text-xs" />
              Edit expert profile
            </Link>
            <Link
              href="/dashboard/experts"
              className="inline-flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50"
            >
              <FaFileAlt className="text-xs" />
              View directory listing
            </Link>
          </>
        )}

        {status === 'rejected' && canReapplyNow && (
          <Link
            href="/dashboard/expert-application"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700"
          >
            <FaUserMd className="text-xs" />
            Re-apply as expert
          </Link>
        )}

        {(status === 'pending' || status === 'rejected') && (
          <Link
            href="/dashboard/settings?tab=professional"
            className="inline-flex items-center rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50"
          >
            Professional settings
          </Link>
        )}
      </div>
    </section>
  )
}
