import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'

async function getInviteByToken(token: string) {
  return await (supabaseAdmin as any)
    .from('baby_invites')
    .select('id,baby_id,invited_email,relationship,status,expires_at,babies(name)')
    .eq('invite_token', token)
    .single()
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { data: invite, error } = await getInviteByToken(token)
    if (error || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    const isExpired = invite.expires_at ? new Date(invite.expires_at).getTime() < Date.now() : false
    const { data: userMatch } = await (supabaseAdmin as any).auth.admin.listUsers({ page: 1, perPage: 1000 })
    const isRegistered = Array.isArray(userMatch?.users)
      ? userMatch.users.some((u: any) => (u.email || '').toLowerCase() === String(invite.invited_email || '').toLowerCase())
      : false

    return NextResponse.json({
      invite: {
        id: invite.id,
        babyId: invite.baby_id,
        babyName: (invite as any)?.babies?.name || 'Baby',
        email: invite.invited_email,
        relationship: invite.relationship,
        status: invite.status,
        isExpired,
      },
      isRegistered,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || 'accept')

    const { data: invite, error } = await getInviteByToken(token)
    if (error || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    if (String(invite.invited_email || '').toLowerCase() !== String(user.email || '').toLowerCase()) {
      return NextResponse.json({ error: 'This invite is for a different email account' }, { status: 403 })
    }

    if (action === 'withdraw') {
      const { error: withdrawError } = await (supabaseAdmin as any)
        .from('baby_invites')
        .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() } as any)
        .eq('id', invite.id)
      if (withdrawError) return NextResponse.json({ error: withdrawError.message }, { status: 400 })
      return NextResponse.json({ ok: true, status: 'withdrawn' })
    }

    if (invite.status === 'withdrawn') {
      return NextResponse.json({ error: 'This invitation has been withdrawn' }, { status: 400 })
    }
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 })
    }

    const { data: existing } = await (supabaseAdmin as any)
      .from('baby_parents')
      .select('id')
      .eq('baby_id', invite.baby_id)
      .eq('parent_id', user.id)
      .maybeSingle()

    if (existing?.id) {
      const { error: updateRelationError } = await (supabaseAdmin as any)
        .from('baby_parents')
        .update({
          relationship: invite.relationship,
          invitation_status: 'accepted',
          accepted_at: new Date().toISOString(),
          can_edit_profile: false,
          can_record_audio: true,
          can_view_history: true,
          access_level: 'read_only',
        } as any)
        .eq('id', existing.id)
      if (updateRelationError) return NextResponse.json({ error: updateRelationError.message }, { status: 400 })
    } else {
      const { error: insertRelationError } = await (supabaseAdmin as any).from('baby_parents').insert({
        baby_id: invite.baby_id,
        parent_id: user.id,
        relationship: invite.relationship,
        is_primary: false,
        invitation_status: 'accepted',
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        can_edit_profile: false,
        can_record_audio: true,
        can_view_history: true,
        access_level: 'read_only',
      } as any)
      if (insertRelationError) return NextResponse.json({ error: insertRelationError.message }, { status: 400 })
    }

    const { error: inviteUpdateError } = await (supabaseAdmin as any)
      .from('baby_invites')
      .update({ status: 'approved', accepted_at: new Date().toISOString() } as any)
      .eq('id', invite.id)

    if (inviteUpdateError) return NextResponse.json({ error: inviteUpdateError.message }, { status: 400 })
    return NextResponse.json({ ok: true, status: 'approved' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
