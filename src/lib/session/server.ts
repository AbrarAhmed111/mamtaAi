import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { isProfileSuspended } from '@/lib/admin/auth'
import { isVerifiedExpert } from '@/lib/expert/profile-role'
import {
  SESSION_INVALID_HEADER,
  type SessionAccessSnapshot,
  type SessionInvalidCode,
  type SessionStatusResponse,
} from './types'

export type ActiveProfileRow = {
  id: string
  role: string | null
  is_expert: boolean | null
  is_verified: boolean | null
  metadata: unknown
  full_name: string
  avatar_url: string | null
  onboarding_completed: boolean | null
  active_view: string | null
  verification_data: unknown
  timezone: string | null
  phone_number: string | null
  created_at: string | null
  updated_at: string | null
}

const SESSION_INVALID_STATUS: Record<SessionInvalidCode, number> = {
  unauthenticated: 401,
  account_deleted: 401,
  account_suspended: 403,
}

const SESSION_INVALID_MESSAGES: Record<SessionInvalidCode, string> = {
  unauthenticated: 'Please sign in to continue.',
  account_deleted: 'This account no longer exists. Please sign in again.',
  account_suspended: 'Your account has been suspended.',
}

export function sessionInvalidResponse(
  code: SessionInvalidCode,
  message?: string,
): NextResponse {
  const status = SESSION_INVALID_STATUS[code]
  return NextResponse.json(
    {
      ok: false,
      code,
      message: message ?? SESSION_INVALID_MESSAGES[code],
    },
    {
      status,
      headers: { [SESSION_INVALID_HEADER]: code },
    },
  )
}

export function toAccessSnapshot(profile: ActiveProfileRow): SessionAccessSnapshot {
  return {
    role: (profile.role || 'parent').toLowerCase(),
    isExpert: isVerifiedExpert(profile),
    suspended: isProfileSuspended(profile.metadata),
  }
}

export async function loadActiveProfile(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
): Promise<ActiveProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, role, is_expert, is_verified, metadata, full_name, avatar_url, onboarding_completed, active_view, verification_data, timezone, phone_number, created_at, updated_at',
    )
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data as ActiveProfileRow
}

export async function requireActiveProfile(): Promise<
  | { ok: true; user: User; profile: ActiveProfileRow; supabase: Awaited<ReturnType<typeof createServerClient>> }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, response: sessionInvalidResponse('unauthenticated') }
  }

  const profile = await loadActiveProfile(supabase, user.id)
  if (!profile) {
    return { ok: false, response: sessionInvalidResponse('account_deleted') }
  }

  if (isProfileSuspended(profile.metadata)) {
    return { ok: false, response: sessionInvalidResponse('account_suspended') }
  }

  return { ok: true, user, profile, supabase }
}

export async function buildSessionStatus(userId: string): Promise<SessionStatusResponse> {
  const supabase = await createServerClient()
  const profile = await loadActiveProfile(supabase, userId)

  if (!profile) {
    return {
      ok: false,
      code: 'account_deleted',
      message: SESSION_INVALID_MESSAGES.account_deleted,
    }
  }

  if (isProfileSuspended(profile.metadata)) {
    return {
      ok: false,
      code: 'account_suspended',
      message: SESSION_INVALID_MESSAGES.account_suspended,
    }
  }

  let subscriptionSlug: string | null = null
  const { data: subRow } = await supabase
    .from('user_subscriptions')
    .select('plan:subscription_plans!user_subscriptions_plan_id_fkey(slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  subscriptionSlug = (subRow?.plan as { slug?: string } | null)?.slug ?? 'free'

  return {
    ok: true,
    access: toAccessSnapshot(profile),
    subscriptionSlug,
  }
}

/** Revoke all refresh tokens for a user (immediate sign-out on other devices). */
export async function revokeAllUserSessions(adminDb: {
  auth: { admin: { signOut: (id: string, scope?: 'global' | 'local' | 'others') => Promise<{ error: unknown }> } }
}, userId: string): Promise<void> {
  try {
    await adminDb.auth.admin.signOut(userId, 'global')
  } catch {
    // Non-fatal — suspension still enforced on next API/navigation check
  }
}
