import { NextResponse } from 'next/server'
import { requireOximeterAuth, requireBabyAccess } from '@/lib/oximeter/access'

export async function GET(request: Request) {
  const auth = await requireOximeterAuth()
  if (!auth.ok) return auth.response

  const babyId = new URL(request.url).searchParams.get('babyId')
  if (!babyId) {
    return NextResponse.json({ error: 'babyId is required' }, { status: 400 })
  }

  const denied = await requireBabyAccess(auth.supabase, auth.user.id, babyId)
  if (denied) return denied

  const { data, error } = await auth.supabase
    .from('oximeter_readings')
    .select('*')
    .eq('baby_id', babyId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reading: data ?? null })
}
