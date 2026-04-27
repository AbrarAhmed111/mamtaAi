import { NextResponse, type NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { createInviteEmailTemplate } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email/send-email'
import { getInviteEmailLogoMailParts } from '@/lib/email/invite-email-logo'

function getBaseURL(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return request.nextUrl.origin
}

const ALLOWED_RELATIONSHIPS = new Set(['mother', 'father', 'guardian', 'caregiver', 'grandparent', 'other'])

async function requireOwnerAccess(babyId: string) {
  const supabase: any = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase, user: null as any }

  const { data: membership } = await supabase
    .from('baby_parents')
    .select('can_edit_profile, relationship')
    .eq('baby_id', babyId)
    .eq('parent_id', user.id)
    .eq('invitation_status', 'accepted')
    .single()

  if (!membership?.can_edit_profile) {
    return { error: NextResponse.json({ error: 'Only primary parent can send invites' }, { status: 403 }), supabase, user }
  }

  return { error: null as NextResponse | null, supabase, user }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error, supabase } = await requireOwnerAccess(id)
    if (error) return error

    const { data, error: listError } = await supabase
      .from('baby_invites')
      .select('id, invited_email, relationship, status, invited_at, accepted_at, withdrawn_at, expires_at')
      .eq('baby_id', id)
      .order('invited_at', { ascending: false })

    if (listError) return NextResponse.json({ error: listError.message }, { status: 400 })
    return NextResponse.json({ invites: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error, supabase, user } = await requireOwnerAccess(id)
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const email = String(body?.email || '').trim().toLowerCase()
    const relationship = String(body?.relationship || 'other').trim().toLowerCase()

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!ALLOWED_RELATIONSHIPS.has(relationship)) {
      return NextResponse.json({ error: 'Invalid relationship' }, { status: 400 })
    }

    const { data: baby } = await supabase.from('babies').select('id,name').eq('id', id).single()
    if (!baby) return NextResponse.json({ error: 'Baby not found' }, { status: 404 })

    const { data: selfUser } = await supabase.auth.getUser()
    if ((selfUser.user?.email || '').toLowerCase() === email) {
      return NextResponse.json({ error: 'You cannot invite your own email' }, { status: 400 })
    }

    const token = randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    const { data: existing } = await supabase
      .from('baby_invites')
      .select('id')
      .eq('baby_id', id)
      .eq('invited_email', email)
      .in('status', ['waiting', 'approved'])
      .maybeSingle()

    let inviteId: string | null = null
    if (existing?.id) {
      inviteId = existing.id
      const { error: updateError } = await supabase
        .from('baby_invites')
        .update({
          relationship,
          invited_by: user.id,
          status: 'waiting',
          invite_token: token,
          invited_at: now,
          withdrawn_at: null,
          accepted_at: null,
          expires_at: expiresAt,
        } as any)
        .eq('id', existing.id)
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
    } else {
      const { data: created, error: createError } = await supabase
        .from('baby_invites')
        .insert({
          baby_id: id,
          invited_by: user.id,
          invited_email: email,
          relationship,
          status: 'waiting',
          invite_token: token,
          invited_at: now,
          expires_at: expiresAt,
        } as any)
        .select('id')
        .single()

      if (createError || !created) {
        return NextResponse.json({ error: createError?.message || 'Failed to create invite' }, { status: 400 })
      }
      inviteId = created.id
    }

    const siteBase = getBaseURL(request).replace(/\/$/, '')
    const inviteLink = `${siteBase}/invite/${token}`
    const { logoUrl, attachments: logoAttachments } = getInviteEmailLogoMailParts(siteBase)

    let inviteeDisplayName: string | null = null
    try {
      const usersResult = await (supabaseAdmin as any).auth.admin.listUsers({ page: 1, perPage: 1000 })
      const matched = Array.isArray(usersResult?.data?.users)
        ? usersResult.data.users.find((u: any) => String(u?.email || '').toLowerCase() === email)
        : null
      if (matched?.id) {
        const { data: prof } = await (supabaseAdmin as any)
          .from('profiles')
          .select('full_name')
          .eq('id', matched.id)
          .maybeSingle()
        const fromProfile = typeof prof?.full_name === 'string' ? prof.full_name.trim() : ''
        const meta = matched.user_metadata as Record<string, unknown> | undefined
        const fromMeta =
          (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
          (typeof meta?.name === 'string' && meta.name.trim()) ||
          ''
        inviteeDisplayName = fromProfile || fromMeta || null

        await (supabaseAdmin as any).from('notifications').insert({
          user_id: matched.id,
          title: 'Family invite received',
          body: `You are invited to access ${baby.name} as ${relationship}.`,
          notification_type: 'system',
          category: 'invite',
          priority: 'high',
          action_type: 'invite',
          action_url: `/invite/${token}`,
          action_data: {
            inviteToken: token,
            babyName: baby.name,
            relationship,
            inviteId,
          },
          metadata: { source: 'baby_invite' },
        } as any)
      }
    } catch {
      // Non-blocking: invite is still created even if notification / name lookup fails.
    }

    const html = createInviteEmailTemplate({
      inviteeDisplayName,
      babyName: baby.name,
      inviteLink,
      logoUrl,
    })

    const emailResult = await sendEmail({
      to: email,
      subject: `You are invited to ${baby.name}'s dashboard`,
      html,
      attachments: logoAttachments.length > 0 ? logoAttachments : undefined,
    })

    return NextResponse.json({
      ok: true,
      inviteId,
      emailSent: emailResult.ok,
      warning: emailResult.ok ? null : emailResult.error || 'Invite created, but email sending failed.',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error, supabase } = await requireOwnerAccess(id)
    if (error) return error

    const inviteId = request.nextUrl.searchParams.get('inviteId')
    if (!inviteId) return NextResponse.json({ error: 'inviteId is required' }, { status: 400 })

    const { error: updateError } = await (supabaseAdmin as any)
      .from('baby_invites')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
      } as any)
      .eq('id', inviteId)
      .eq('baby_id', id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
