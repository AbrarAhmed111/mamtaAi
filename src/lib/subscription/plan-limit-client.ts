import type { PlanLimitApiError } from '@/hooks/useSubscription'
import { isPlanLimitError } from '@/hooks/useSubscription'

type PlanLimitHandler = (payload: PlanLimitApiError) => void

let planLimitHandler: PlanLimitHandler | null = null

export function registerPlanLimitHandler(handler: PlanLimitHandler | null) {
  planLimitHandler = handler
}

export function notifyPlanLimit(data: unknown): boolean {
  if (!isPlanLimitError(data)) return false
  planLimitHandler?.(data)
  return true
}
