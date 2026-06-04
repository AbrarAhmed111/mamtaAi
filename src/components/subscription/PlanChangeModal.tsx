'use client'

import { useEffect } from 'react'
import { FaArrowRight, FaClock, FaExclamationTriangle, FaTimes } from 'react-icons/fa'
import { PLAN_DEFINITIONS, planRank } from '@/lib/subscription/plans'
import type { PlanSlug } from '@/lib/subscription/types'

type PlanChangeModalProps = {
  open: boolean
  currentSlug: PlanSlug
  currentPlanName: string
  targetSlug: 'plus' | 'pro'
  submitting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function PlanChangeModal({
  open,
  currentSlug,
  currentPlanName,
  targetSlug,
  submitting = false,
  onConfirm,
  onCancel,
}: PlanChangeModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onCancel])

  if (!open) return null

  const target = PLAN_DEFINITIONS[targetSlug]
  const fromFree = currentSlug === 'free'
  const isDowngrade = !fromFree && planRank(targetSlug) < planRank(currentSlug)

  const title = isDowngrade ? `Switch to ${target.name}?` : `Upgrade to ${target.name}?`

  const description = fromFree
    ? `You'll be taken to secure Stripe checkout to start the ${target.name} plan at $${target.price_usd}/month. You can cancel anytime.`
    : isDowngrade
      ? `You'll keep your current ${currentPlanName} plan and all of its features until the end of your billing period. After that you'll move to ${target.name} ($${target.price_usd}/mo). You won't be charged now.`
      : `Your plan upgrades to ${target.name} ($${target.price_usd}/mo) right away. Your card is charged a prorated amount for the remainder of this billing period.`

  const confirmLabel = fromFree
    ? 'Continue to checkout'
    : isDowngrade
      ? 'Schedule switch'
      : 'Confirm upgrade'

  const submittingLabel = fromFree
    ? 'Redirecting…'
    : isDowngrade
      ? 'Scheduling…'
      : 'Upgrading…'

  const accent = isDowngrade
    ? { icon: FaClock, ring: 'bg-amber-100 text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600' }
    : {
        icon: FaArrowRight,
        ring: 'bg-pink-100 text-pink-600',
        btn: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600',
      }
  const AccentIcon = accent.icon

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-change-title"
    >
      <button
        type="button"
        aria-label="Close"
        disabled={submitting}
        onClick={onCancel}
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
        >
          <FaTimes className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-7">
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${accent.ring}`}
          >
            <AccentIcon className="h-5 w-5" />
          </div>
          <h2
            id="plan-change-title"
            className="text-center text-xl font-bold text-gray-900"
          >
            {title}
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-gray-600">{description}</p>

          {isDowngrade && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <FaExclamationTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Some {currentPlanName} features and higher limits will no longer be available after
                the switch takes effect.
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all disabled:cursor-wait disabled:opacity-70 ${accent.btn}`}
            >
              {submitting ? submittingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
