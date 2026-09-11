import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'
import { checkLimit, getPlanLimits, planLimitErrorResponse } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

const allowedRelations = new Set(['mother', 'father', 'guardian', 'caregiver', 'grandparent', 'other'])

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { data: membership, error: membershipError } = await (supabaseAdmin as any)
    .from('baby_parents')
    .select('baby_id, is_primary, access_level')
    .eq('parent_id', auth.auth.user.id)

  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 })
  const babyIds = [...new Set((membership || []).map((row: any) => row.baby_id).filter(Boolean))]
  if (!babyIds.length) return NextResponse.json({ babies: [] })

  const { data, error } = await (supabaseAdmin as any)
    .from('babies')
    .select('id, name, gender, birth_date, avatar_url, medical_notes, created_at')
    .in('id', babyIds)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    babies: (data || []).map((baby: any) => ({
      id: baby.id,
      name: baby.name,
      gender: baby.gender,
      birthDate: baby.birth_date,
      avatarUrl: baby.avatar_url,
      medicalNotes: baby.medical_notes,
    })),
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const name = String(body.name || '').trim()
  const birthDate = String(body.birthDate || body.birth_date || '').trim()
  const relationship = String(body.relationship || 'other').trim()
  const gender = String(body.gender || '').trim() || null

  if (!name || !birthDate) {
    return NextResponse.json({ error: 'Name and birth date are required' }, { status: 400 })
  }
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime()) || birth.getTime() > Date.now()) {
    return NextResponse.json({ error: 'Invalid birth date' }, { status: 400 })
  }
  if (!allowedRelations.has(relationship)) {
    return NextResponse.json({ error: 'Please select a valid relationship' }, { status: 400 })
  }

  const timezone = auth.auth.profile?.timezone ?? null
  const planCtx = await getPlanLimits(auth.auth.user.id, timezone)
  const babyLimit = await checkLimit(auth.auth.user.id, 'create_baby', { timezone })
  if (!babyLimit.allowed) return planLimitErrorResponse(babyLimit, planCtx.slug)

  const { data: baby, error: babyError } = await (supabaseAdmin as any)
    .from('babies')
    .insert({
      name,
      birth_date: birthDate,
      gender: gender === 'male' || gender === 'female' ? gender : null,
      is_active: true,
      avatar_url: body.avatarUrl || body.avatar_url || null,
      medical_notes: body.medicalNotes || body.medical_notes || null,
    })
    .select('*')
    .single()

  if (babyError || !baby) {
    return NextResponse.json({ error: babyError?.message || 'Failed to create baby' }, { status: 400 })
  }

  const { error: memberError } = await (supabaseAdmin as any).from('baby_parents').insert({
    baby_id: baby.id,
    parent_id: auth.auth.user.id,
    relationship,
    is_primary: true,
    access_level: 'full',
    can_edit_profile: true,
    can_record_audio: true,
    can_view_history: true,
    invitation_status: 'accepted',
  })

  if (memberError) {
    await (supabaseAdmin as any).from('babies').delete().eq('id', baby.id)
    return NextResponse.json({ error: memberError.message }, { status: 400 })
  }

  return NextResponse.json({
    baby: {
      id: baby.id,
      name: baby.name,
      birthDate: baby.birth_date,
      gender: baby.gender,
      avatarUrl: baby.avatar_url,
    },
  }, { status: 201 })
}
