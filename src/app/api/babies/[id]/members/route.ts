import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'

const ACCESS_OPTIONS = new Set(['full', 'read_only'])

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase: any = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: babyId } = await params

    const { data: myRow } = await supabase
      .from('baby_parents')
      .select('is_primary')
      .eq('baby_id', babyId)
      .eq('parent_id', user.id)
      .single()

    if (!myRow?.is_primary) {
      return NextResponse.json({ error: 'Only the primary parent can manage family access' }, { status: 403 })
    }

    const { data: rows, error } = await supabase
      .from('baby_parents')
      .select(
        'id, parent_id, relationship, access_level, can_edit_profile, can_record_audio, can_view_history, is_primary, parent_profile:profiles!baby_parents_parent_id_fkey ( full_name )',
      )
      .eq('baby_id', babyId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const members = (rows || []).map((r: any) => ({
      id: r.id,
      parentId: r.parent_id,
      fullName: r.parent_profile?.full_name || 'Unknown',
      relationship: r.relationship || 'other',
      accessLevel: r.access_level || 'read_only',
      isPrimary: Boolean(r.is_primary),
    }))

    return NextResponse.json({ members })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase: any = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: babyId } = await params
    const body = await request.json().catch(() => ({}))
    const targetParentId = String(body?.parentId || '')
    const access = String(body?.access || '').toLowerCase()

    if (!targetParentId || !ACCESS_OPTIONS.has(access)) {
      return NextResponse.json({ error: 'parentId and access (full | read_only) are required' }, { status: 400 })
    }

    const { data: myRow } = await supabase
      .from('baby_parents')
      .select('is_primary')
      .eq('baby_id', babyId)
      .eq('parent_id', user.id)
      .single()

    if (!myRow?.is_primary) {
      return NextResponse.json({ error: 'Only the primary parent can change access' }, { status: 403 })
    }

    const { data: target } = await supabase
      .from('baby_parents')
      .select('id, is_primary, parent_id')
      .eq('baby_id', babyId)
      .eq('parent_id', targetParentId)
      .single()

    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (target.is_primary) {
      return NextResponse.json({ error: 'Cannot change access for the primary parent' }, { status: 400 })
    }

    const updates =
      access === 'full'
        ? {
            access_level: 'full',
            can_edit_profile: true,
            can_record_audio: true,
            can_view_history: true,
          }
        : {
            access_level: 'read_only',
            can_edit_profile: false,
            can_record_audio: true,
            can_view_history: true,
          }

    const { error } = await (supabaseAdmin as any).from('baby_parents').update(updates as any).eq('id', target.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase: any = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: babyId } = await params
    const targetParentId = String(request.nextUrl.searchParams.get('parentId') || '').trim()
    if (!targetParentId) {
      return NextResponse.json({ error: 'parentId query parameter is required' }, { status: 400 })
    }
    if (targetParentId === user.id) {
      return NextResponse.json(
        { error: 'Use Leave this child profile (below) to remove yourself instead.' },
        { status: 400 },
      )
    }

    const { data: myRow } = await supabase
      .from('baby_parents')
      .select('is_primary')
      .eq('baby_id', babyId)
      .eq('parent_id', user.id)
      .single()

    if (!myRow?.is_primary) {
      return NextResponse.json({ error: 'Only the primary parent can remove a relation' }, { status: 403 })
    }

    const { data: target } = await supabase
      .from('baby_parents')
      .select('id, is_primary, parent_id')
      .eq('baby_id', babyId)
      .eq('parent_id', targetParentId)
      .single()

    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (target.is_primary) {
      return NextResponse.json({ error: 'Cannot remove the primary parent' }, { status: 400 })
    }

    const { error } = await (supabaseAdmin as any).from('baby_parents').delete().eq('id', target.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
