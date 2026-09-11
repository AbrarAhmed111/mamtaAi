'use client'

import {
  SESSION_INVALID_HEADER,
  type SessionAccessSnapshot,
  type SessionInvalidCode,
  type SessionStatusResponse,
} from '@/lib/session/types'
import { notifyPlanLimit } from '@/lib/subscription/plan-limit-client'
import { isPlanLimitError } from '@/hooks/useSubscription'

type SessionInvalidHandler = (code: SessionInvalidCode) => void

let sessionInvalidHandler: SessionInvalidHandler | null = null

export function registerSessionInvalidHandler(handler: SessionInvalidHandler | null) {
  sessionInvalidHandler = handler
}

export function parseSessionInvalidCode(
  response: Response,
  body?: { code?: string } | null,
): SessionInvalidCode | null {
  const header = response.headers.get(SESSION_INVALID_HEADER)
  if (
    header === 'unauthenticated' ||
    header === 'account_deleted' ||
    header === 'account_suspended'
  ) {
    return header
  }
  const code = body?.code
  if (
    code === 'unauthenticated' ||
    code === 'account_deleted' ||
    code === 'account_suspended'
  ) {
    return code
  }
  return null
}

export function notifySessionInvalid(code: SessionInvalidCode) {
  sessionInvalidHandler?.(code)
}

/** Fetch wrapper that detects session invalidation and triggers global handler */
export async function dashboardFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init)
  const headerCode = parseSessionInvalidCode(res)
  if (headerCode) {
    notifySessionInvalid(headerCode)
    return res
  }

  if (res.status === 401 || res.status === 403) {
    const cloned = res.clone()
    const body = await cloned.json().catch(() => null)
    if (isPlanLimitError(body)) {
      notifyPlanLimit(body)
      return res
    }
    const code = parseSessionInvalidCode(res, body)
    if (code) {
      notifySessionInvalid(code)
    }
  }

  return res
}

export function snapshotFromProfile(profile: {
  role?: string | null
  is_expert?: boolean | null
  is_verified?: boolean | null
  metadata?: unknown
}): SessionAccessSnapshot {
  const role = (profile.role || 'parent').toLowerCase()
  const isExpertLegacy = role === 'expert' && profile.is_verified === true
  const meta =
    profile.metadata && typeof profile.metadata === 'object' && !Array.isArray(profile.metadata)
      ? (profile.metadata as Record<string, unknown>)
      : null

  return {
    role: role === 'expert' ? 'parent' : role,
    isExpert: profile.is_expert === true || isExpertLegacy,
    suspended: Boolean(meta?.suspended),
  }
}

export type { SessionStatusResponse, SessionAccessSnapshot }
