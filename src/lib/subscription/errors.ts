import { NextResponse } from 'next/server'
import type { PlanLimitCheckResult, PlanLimitErrorBody, PlanSlug } from './types'
import { recommendedUpgrade } from './plans'

export function planLimitErrorResponse(
  check: PlanLimitCheckResult,
  slug: PlanSlug,
): NextResponse<PlanLimitErrorBody> {
  return NextResponse.json(
    {
      error: 'PLAN_LIMIT_REACHED',
      message: check.error || 'This action is not available on your current plan.',
      upgradeRequired: true,
      recommendedPlan: check.recommendedPlan ?? recommendedUpgrade(slug),
      code: check.code,
      current: check.current,
      max: check.max,
    },
    { status: 403 },
  )
}
