'use client'

import Link from 'next/link'
import { FaCrown, FaGem, FaSeedling } from 'react-icons/fa'
import { useSubscription } from '@/hooks/useSubscription'
import { PLAN_DEFINITIONS } from '@/lib/subscription/plans'
import type { PlanSlug } from '@/lib/subscription/types'

const BADGE_CONFIG: Record<
  PlanSlug,
  {
    label: string
    Icon: typeof FaSeedling
    pill: string
    iconRing: string
    tooltipAccent: string
  }
> = {
  free: {
    label: 'FREE',
    Icon: FaSeedling,
    pill: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
    iconRing: 'bg-slate-100 text-slate-600',
    tooltipAccent: 'text-slate-600',
  },
  plus: {
    label: 'PLUS',
    Icon: FaGem,
    pill: 'border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-800 hover:from-pink-100 hover:to-rose-100',
    iconRing: 'bg-pink-100 text-pink-600',
    tooltipAccent: 'text-pink-600',
  },
  pro: {
    label: 'PRO',
    Icon: FaCrown,
    pill: 'border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 text-purple-900 hover:from-purple-100 hover:via-pink-100 hover:to-rose-100',
    iconRing: 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700',
    tooltipAccent: 'text-purple-700',
  },
}

export default function PlanHeaderBadge() {
  const { loading, slug, planName, meters } = useSubscription()

  if (loading) {
    return (
      <div
        className="h-8 w-[4.5rem] shrink-0 animate-pulse rounded-full bg-gray-100"
        aria-hidden="true"
      />
    )
  }

  const plan = PLAN_DEFINITIONS[slug]
  const config = BADGE_CONFIG[slug]
  const { Icon } = config
  const priceLabel =
    plan.price_usd === 0 ? 'No monthly charge' : `$${plan.price_usd}/month`
  const recordingMeter = meters.recordings

  return (
    <div className="relative shrink-0 group">
      <div
        tabIndex={0}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors cursor-default outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 ${config.pill}`}
        aria-describedby="plan-header-tooltip"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${config.iconRing}`}
        >
          <Icon className="h-2.5 w-2.5" aria-hidden />
        </span>
        {config.label}
      </div>

      <div className="absolute right-0 top-full z-[60] pt-2 opacity-0 invisible translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0">
      <div
        id="plan-header-tooltip"
        role="tooltip"
        className="w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-pink-100 bg-white p-4 shadow-xl"
      >
        <p className={`text-xs font-semibold uppercase tracking-wide ${config.tooltipAccent}`}>
          {planName} plan
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-900">{priceLabel}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{plan.description}</p>
        {recordingMeter && recordingMeter.max != null && (
          <p className="mt-2 text-xs text-gray-500">
            {recordingMeter.used}/{recordingMeter.max} {recordingMeter.label.toLowerCase()} this month
          </p>
        )}
        <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3">
          {plan.features.slice(0, 4).map(feature => (
            <li key={feature} className="text-xs text-gray-700 leading-snug">
              · {feature}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs">
          <Link
            href={slug === 'free' ? '/pricing' : '/dashboard/settings?tab=billing'}
            className="font-semibold text-pink-600 hover:underline"
          >
            {slug === 'free' ? 'View plans →' : 'Manage plan →'}
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
