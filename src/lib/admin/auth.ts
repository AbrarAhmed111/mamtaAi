import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export type AdminProfile = {
  id: string
  role: string
  full_name: string
  metadata: Record<string, unknown> | null
}

export function isProfileSuspended(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false
  return Boolean((metadata as Record<string, unknown>).suspended)
}

export async function requireAdminApi(): Promise<
  | { ok: true; admin: AdminProfile }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, metadata')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  if (isProfileSuspended(profile.metadata)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Account suspended' }, { status: 403 }),
    }
  }

  return {
    ok: true,
    admin: {
      id: profile.id,
      role: profile.role,
      full_name: profile.full_name,
      metadata: (profile.metadata as Record<string, unknown>) ?? null,
    },
  }
}

export function getAdminDb() {
  return supabaseAdmin
}
