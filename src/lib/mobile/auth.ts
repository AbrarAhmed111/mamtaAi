import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ensureFreeSubscription } from '@/lib/subscription/service'
import { isProfileSuspended } from '@/lib/admin/auth'

export type MobileAuthContext = {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    full_name: string | null
    role: string | null
    metadata: Record<string, unknown> | null
    timezone?: string | null
  } | null
}

export function mobileError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireMobileAuth(
  request: NextRequest,
): Promise<{ ok: true; auth: MobileAuthContext } | { ok: false; response: NextResponse }> {
  const header = request.headers.get('authorization') || ''
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) {
    return { ok: false, response: mobileError('Missing bearer token', 401) }
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  const user = userData.user
  if (userError || !user?.id) {
    return { ok: false, response: mobileError('Unauthorized', 401) }
  }

  const { data: profile, error: profileError } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id, full_name, role, metadata, timezone')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { ok: false, response: mobileError(profileError.message, 500) }
  }
  if (isProfileSuspended(profile?.metadata)) {
    return { ok: false, response: mobileError('Account suspended', 403) }
  }

  await ensureFreeSubscription(user.id)

  return {
    ok: true,
    auth: {
      user: {
        id: user.id,
        email: user.email ?? '',
      },
      profile: (profile as MobileAuthContext['profile']) ?? null,
    },
  }
}

export async function requireMobileBabyAccess(userId: string, babyId: string) {
  const { data, error } = await (supabaseAdmin as any)
    .from('baby_parents')
    .select('baby_id, access_level, can_record_audio, can_view_history')
    .eq('parent_id', userId)
    .eq('baby_id', babyId)
    .maybeSingle()

  if (error) return { ok: false as const, response: mobileError(error.message, 500) }
  if (!data?.baby_id) return { ok: false as const, response: mobileError('Baby not found', 404) }
  return { ok: true as const, membership: data as any }
}

