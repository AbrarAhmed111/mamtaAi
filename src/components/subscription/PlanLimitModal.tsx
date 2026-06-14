'use client'

import Link from 'next/link'
import { FaCrown, FaTimes } from 'react-icons/fa'
import { getPlanDefinition } from '@/lib/subscription/plans'
import { getPlanLimitFeatureLabel, getRecommendedPlanLabel } from '@/lib/subscription/plan-limit-ui'
import type { PlanLimitApiError } from '@/hooks/useSubscription'

type PlanLimitModalProps = {
  open: boolean
  payload: PlanLimitApiError | null
  currentPlanName?: string
  onClose: () => void
}

export default function PlanLimitModal({
  open,
  payload,
  currentPlanName,
  onClose,
}: PlanLimitModalProps) {
  if (!open || !payload) return null

  const feature = getPlanLimitFeatureLabel(payload.code)
  const recommended = payload.recommendedPlan
  const recommendedPlan = recommended ? getPlanDefinition(recommended) : null
  const pricingHref = recommended ? `/pricing?plan=${recommended}` : '/pricing'

  const usageHint =
    payload.current != null && payload.max != null
      ? `You've used ${payload.current} of ${payload.max} on your current plan.`
      : null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-pink-100 bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-limit-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white">
          <FaCrown className="text-lg" aria-hidden />
        </div>

        <h2 id="plan-limit-title" className="pr-8 text-xl font-bold text-gray-900">
          Upgrade to use {feature.toLowerCase()}
        </h2>

        {currentPlanName ? (
          <p className="mt-1 text-sm text-gray-500">Current plan: {currentPlanName}</p>
        ) : null}

        <p className="mt-4 text-sm leading-relaxed text-gray-700">
          {payload.message || 'This action is not available on your current plan.'}
        </p>

        {usageHint ? <p className="mt-2 text-sm font-medium text-pink-700">{usageHint}</p> : null}

        {recommendedPlan ? (
          <div className="mt-4 rounded-xl border border-pink-100 bg-pink-50/80 p-4">
            <p className="text-sm font-semibold text-gray-900">
              Recommended: {recommendedPlan.name}
            </p>
            <p className="mt-1 text-xs text-gray-600">{recommendedPlan.description}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            Subscribe to {getRecommendedPlanLabel(recommended)} to unlock this feature.
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Not now
          </button>
          <Link
            href={pricingHref}
            onClick={onClose}
            className="flex-1 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:from-pink-700 hover:to-rose-700"
          >
            View plans & subscribe
          </Link>
        </div>
      </div>
    </div>
  )
}
