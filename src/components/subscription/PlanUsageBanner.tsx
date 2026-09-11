'use client'

import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'

export default function PlanUsageBanner() {
  const { loading, slug, planName, showUpsellBanners, meters } = useSubscription()

  if (loading || !showUpsellBanners) return null

  const recordingMeter = meters.recordings
  const nearLimit =
    recordingMeter &&
    recordingMeter.max != null &&
    recordingMeter.used >= Math.max(1, recordingMeter.max - 1)

  return (
    <div className="mb-4 rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {planName} plan
          {recordingMeter && recordingMeter.max != null && (
            <span className="font-normal text-gray-600">
              {' '}
              · {recordingMeter.used}/{recordingMeter.max} {recordingMeter.label.toLowerCase()}
            </span>
          )}
        </p>
        {nearLimit && (
          <p className="text-xs text-rose-700 mt-0.5">
            You&apos;re almost at your monthly cry analysis limit.
          </p>
        )}
      </div>
      {slug !== 'pro' && (
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 shrink-0"
        >
          Upgrade to {slug === 'free' ? 'Plus' : 'Pro'}
        </Link>
      )}
    </div>
  )
}
