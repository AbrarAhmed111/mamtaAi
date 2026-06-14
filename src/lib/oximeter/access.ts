import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireActiveProfile } from '@/lib/session/server'

export async function requireOximeterAuth() {
  const auth = await requireActiveProfile()
  if (!auth.ok) return { ok: false as const, response: auth.response }
  return { ok: true as const, supabase: auth.supabase, user: auth.user, profile: auth.profile }
}

export async function userHasBabyAccess(
  supabase: SupabaseClient,
  userId: string,
  babyId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('baby_parents')
    .select('id')
    .eq('baby_id', babyId)
    .eq('parent_id', userId)
    .eq('invitation_status', 'accepted')
    .maybeSingle()
  return Boolean(data)
}

export async function requireBabyAccess(
  supabase: SupabaseClient,
  userId: string,
  babyId: string,
): Promise<NextResponse | null> {
  const allowed = await userHasBabyAccess(supabase, userId, babyId)
  if (!allowed) {
    return NextResponse.json({ error: 'You do not have access to this baby' }, { status: 403 })
  }
  return null
}

export async function requireDeviceOwnership(
  supabase: SupabaseClient,
  userId: string,
  deviceRowId: string,
): Promise<{ device: Record<string, unknown> } | NextResponse> {
  const { data, error } = await supabase
    .from('oximeter_devices')
    .select('*')
    .eq('id', deviceRowId)
    .eq('owner_id', userId)
    .maybeSingle()
  if (error || !data) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }
  return { device: data as Record<string, unknown> }
}
