import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { accessBadgeLabel, type BabyMembershipPermissions } from '@/lib/baby-permissions'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Ensure the user is a member of the baby
    const { data: membership } = await supabase
      .from('baby_parents')
      .select('baby_id, relationship, access_level, can_edit_profile, can_record_audio, can_view_history, is_primary')
      .eq('baby_id', id)
      .eq('parent_id', user.id)
      .single()
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: baby, error } = await supabase
      .from('babies')
      .select(`
        id,name,gender,birth_date,birth_weight_kg,birth_height_cm,blood_type,avatar_url,medical_notes,is_active,
        baby_parents ( parent_id, relationship, access_level, is_primary, can_edit_profile, parent_profile:profiles!baby_parents_parent_id_fkey ( full_name, id ) )
      `)
      .eq('id', id)
      .single()

    if (error || !baby) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const relationRow = Array.isArray((baby as any).baby_parents)
      ? (baby as any).baby_parents.find((r: any) => r?.parent_id === user.id)
      : null
    const currentUserRelationship = relationRow?.relationship || null
    const currentUserMembership = membership as unknown as BabyMembershipPermissions
    const currentAccessBadge = accessBadgeLabel(currentUserMembership)

    return NextResponse.json({
      baby,
      currentUserRelationship,
      currentUserMembership,
      currentAccessBadge,
      canEditBaby: Boolean(membership.can_edit_profile),
      /** Non-primary members (e.g. invited relatives) may leave this baby’s profile */
      canLeaveMembership: membership.is_primary !== true,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Ensure membership + edit permission
    const { data: membership } = await supabase
      .from('baby_parents')
      .select('baby_id, can_edit_profile')
      .eq('baby_id', id)
      .eq('parent_id', user.id)
      .single()
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!membership.can_edit_profile) {
      return NextResponse.json({ error: 'You do not have permission to edit this baby profile' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))

    // Validate fields similar to POST
    const updates: any = {}
    if (typeof body.name === 'string') updates.name = body.name.trim()
    if (['male', 'female', null, undefined].includes(body.gender ?? undefined)) updates.gender = body.gender ?? null
    if (typeof body.birth_date === 'string') {
      const d = new Date(body.birth_date)
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid birth date' }, { status: 400 })
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      if (diffMs < 0) return NextResponse.json({ error: 'Birth date cannot be in the future' }, { status: 400 })
      const oneYearMs = 365 * 24 * 60 * 60 * 1000
      if (diffMs > oneYearMs) return NextResponse.json({ error: 'We currently support babies up to 12 months old' }, { status: 400 })
      updates.birth_date = body.birth_date
    }
    if (body.birth_weight_kg !== undefined) {
      const n = Number(body.birth_weight_kg)
      if (Number.isNaN(n) || n < 0 || n > 20) return NextResponse.json({ error: 'Birth weight (kg) must be between 0 and 20' }, { status: 400 })
      updates.birth_weight_kg = n
    }
    if (body.birth_height_cm !== undefined) {
      const n = Number(body.birth_height_cm)
      if (Number.isNaN(n) || n < 20 || n > 80) return NextResponse.json({ error: 'Birth height (cm) must be between 20 and 80' }, { status: 400 })
      updates.birth_height_cm = n
    }
    if (typeof body.blood_type === 'string') {
      const allowedBlood = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      if (body.blood_type && !allowedBlood.has(body.blood_type)) return NextResponse.json({ error: 'Invalid blood type' }, { status: 400 })
      updates.blood_type = body.blood_type || null
    }
    if (typeof body.medical_notes === 'string') {
      if (body.medical_notes.length > 500) return NextResponse.json({ error: 'Medical notes must be 500 characters or fewer' }, { status: 400 })
      updates.medical_notes = body.medical_notes || null
    }

    const { error: updateError } = await supabase.from('babies').update(updates).eq('id', id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Ensure membership and check if user has permission to delete
    const { data: membership } = await supabase
      .from('baby_parents')
      .select('baby_id, can_edit_profile')
      .eq('baby_id', id)
      .eq('parent_id', user.id)
      .single()
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!membership.can_edit_profile) {
      return NextResponse.json({ error: 'You do not have permission to delete this baby' }, { status: 403 })
    }

    // Delete baby_parents relationship first (cascade should handle this, but explicit is safer)
    const { error: relationError } = await supabase
      .from('baby_parents')
      .delete()
      .eq('baby_id', id)

    if (relationError) {
      return NextResponse.json({ error: relationError.message }, { status: 400 })
    }

    // Delete the baby record
    const { error: deleteError } = await supabase
      .from('babies')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


