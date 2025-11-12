import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ babies: [] }, { status: 200 })
    }

    // Step 1: get baby ids for current user
    const { data: membership, error: memError } = await supabase
      .from('baby_parents')
      .select('baby_id')
      .eq('parent_id', user.id)

    if (memError) {
      return NextResponse.json({ error: memError.message, babies: [] }, { status: 500 })
    }
    if (!membership?.length) {
      return NextResponse.json({ babies: [] }, { status: 200 })
    }

    const babyIds = Array.from(new Set(membership.map((r: any) => r.baby_id).filter(Boolean)))

    // Step 2: fetch babies with nested relations
    const { data: babiesData, error: babiesError } = await supabase
      .from('babies')
      .select(`
        id,
        name,
        gender,
        birth_date,
        birth_weight_kg,
        birth_height_cm,
        blood_type,
        avatar_url,
        medical_notes,
        is_active,
        baby_parents (
          relationship,
          parent_profile:profiles!baby_parents_parent_id_fkey ( full_name )
        )
      `)
      .in('id', babyIds)

    if (babiesError) {
      return NextResponse.json({ error: babiesError.message, babies: [] }, { status: 500 })
    }

    // Shape: include relations as array of { name, relationship }
    const babies = (babiesData || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      gender: b.gender,
      birth_date: b.birth_date,
      birth_weight_kg: b.birth_weight_kg,
      birth_height_cm: b.birth_height_cm,
      blood_type: b.blood_type,
      avatar_url: b.avatar_url,
      medical_notes: b.medical_notes,
      relations: Array.isArray(b.baby_parents)
        ? b.baby_parents
            .map((r: any) => ({
              name: r?.parent_profile?.full_name || 'Unknown',
              relationship: r?.relationship || 'other',
            }))
            .filter(Boolean)
        : [],
    }))

    return NextResponse.json({ babies })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const name = (body?.name || '').toString().trim()
    const birth_date = (body?.birth_date || '').toString().trim()
    let gender = (body?.gender || '').toString().trim() || null
    const avatar_url = (body?.avatar_url || '').toString().trim() || null
    const birth_weight_kg_raw = body?.birth_weight_kg
    const birth_height_cm_raw = body?.birth_height_cm
    const blood_type = (body?.blood_type || '').toString().trim() || null
    const medical_notes = (body?.medical_notes || '').toString().trim() || null
    const relationship = (body?.relationship || '').toString().trim()

    if (!name || !birth_date) {
      return NextResponse.json({ error: 'Name and birth date are required' }, { status: 400 })
    }

    // Validate age: must be <= 1 year old
    const birth = new Date(birth_date)
    if (Number.isNaN(birth.getTime())) {
      return NextResponse.json({ error: 'Invalid birth date' }, { status: 400 })
    }
    const now = new Date()
    const diffMs = now.getTime() - birth.getTime()
    const oneYearMs = 365 * 24 * 60 * 60 * 1000
    if (diffMs < 0) {
      return NextResponse.json({ error: 'Birth date cannot be in the future' }, { status: 400 })
    }
    if (diffMs > oneYearMs) {
      return NextResponse.json({ error: 'We currently support babies up to 12 months old' }, { status: 400 })
    }

    // Optional numeric validations
    let birth_weight_kg: number | null = null
    if (birth_weight_kg_raw !== undefined && birth_weight_kg_raw !== null && `${birth_weight_kg_raw}` !== '') {
      const n = Number(birth_weight_kg_raw)
      if (Number.isNaN(n) || n < 0 || n > 20) {
        return NextResponse.json({ error: 'Birth weight (kg) must be between 0 and 20' }, { status: 400 })
      }
      birth_weight_kg = n
    }

    let birth_height_cm: number | null = null
    if (birth_height_cm_raw !== undefined && birth_height_cm_raw !== null && `${birth_height_cm_raw}` !== '') {
      const n = Number(birth_height_cm_raw)
      if (Number.isNaN(n) || n < 20 || n > 80) {
        return NextResponse.json({ error: 'Birth height (cm) must be between 20 and 80' }, { status: 400 })
      }
      birth_height_cm = n
    }

    if (medical_notes && medical_notes.length > 500) {
      return NextResponse.json({ error: 'Medical notes must be 500 characters or fewer' }, { status: 400 })
    }

    // Blood type is optional; if provided, allow common values only
    const allowedBlood = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    let bloodTypeToSave: string | null = null
    if (blood_type) {
      if (!allowedBlood.has(blood_type)) {
        return NextResponse.json({ error: 'Invalid blood type' }, { status: 400 })
      }
      bloodTypeToSave = blood_type
    }

    // Restrict gender to only 'male' or 'female' if provided
    if (gender && gender !== 'male' && gender !== 'female') {
      gender = null
    }

    // Validate relationship against allowed set
    const allowedRelations = new Set(['mother', 'father', 'guardian', 'caregiver', 'grandparent', 'other'])
    if (!relationship || !allowedRelations.has(relationship)) {
      return NextResponse.json({ error: 'Please select a valid relationship' }, { status: 400 })
    }

    const { data: baby, error: insertError } = await supabase
      .from('babies')
      .insert({
        name,
        birth_date,
        gender,
        birth_weight_kg,
        birth_height_cm,
        blood_type: bloodTypeToSave,
        avatar_url,
        medical_notes: medical_notes || null,
        is_active: true,
      } as any)
      .select()
      .single()

    if (insertError || !baby) {
      return NextResponse.json({ error: insertError?.message || 'Failed to create baby' }, { status: 400 })
    }

    const { error: relationError } = await supabase
      .from('baby_parents')
      .insert({
        baby_id: baby.id,
        parent_id: user.id,
        relationship,
        is_primary: true,
        access_level: 'full',
        can_edit_profile: true,
        can_record_audio: true,
        can_view_history: true,
        invitation_status: 'accepted',
      } as any)

    if (relationError) {
      // best-effort cleanup
      await supabase.from('babies').delete().eq('id', baby.id)
      return NextResponse.json({ error: relationError.message }, { status: 400 })
    }

    // Mark onboarding completed for the parent profile
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() } as any)
        .eq('id', user.id)
    } catch {
      // ignore profile update failure; baby was created
    }

    return NextResponse.json({ baby })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}




