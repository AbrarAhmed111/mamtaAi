import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import {
  isStickyExpertReviewNotification,
  stickyExpertReviewFilter,
} from '@/lib/notifications/sticky-expert-notifications'

async function markExpertReviewNotificationsRead(adminId: string): Promise<void> {
  const { data: rows } = await (supabaseAdmin as any)
    .from('notifications')
    .select('id, action_data')
    .eq('user_id', adminId)
    .eq('is_read', false)

  const ids = (rows || [])
    .filter((row: { action_data: unknown }) => stickyExpertReviewFilter(row.action_data))
    .map((row: { id: string }) => row.id)

  if (!ids.length) return

  await (supabaseAdmin as any)
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() } as any)
    .in('id', ids)
}

export async function GET(_request: NextRequest) {
  try {
    const supabase: any = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ items: [], unreadCount: 0 })

    const { data, error } = await supabase
      .from('notifications')
      .select('id,title,body,notification_type,is_read,created_at,action_data,action_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) return NextResponse.json({ error: error.message, items: [], unreadCount: 0 }, { status: 400 })

    const items = (data || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      notificationType: n.notification_type,
      isRead: !!n.is_read,
      createdAt: n.created_at,
      actionData: n.action_data || null,
      actionUrl: n.action_url || null,
    }))
    const unreadCount = items.filter((n: any) => !n.isRead).length
    return NextResponse.json({ items, unreadCount })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error', items: [], unreadCount: 0 }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase: any = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const notificationId = body?.notificationId ? String(body.notificationId) : null
    const expertReviewQueueViewed = body?.expertReviewQueueViewed === true

    if (expertReviewQueueViewed) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await markExpertReviewNotificationsRead(user.id)
      return NextResponse.json({ ok: true })
    }

    if (notificationId) {
      const { data: row } = await supabase
        .from('notifications')
        .select('action_data')
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (row && isStickyExpertReviewNotification(row.action_data)) {
        return NextResponse.json({ ok: true, skipped: true })
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString(), is_clicked: true, clicked_at: new Date().toISOString() } as any)
        .eq('id', notificationId)
        .eq('user_id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }

    const { data: unreadRows, error: fetchError } = await supabase
      .from('notifications')
      .select('id, action_data')
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 })

    const idsToMark = (unreadRows || [])
      .filter((row: { action_data: unknown }) => !isStickyExpertReviewNotification(row.action_data))
      .map((row: { id: string }) => row.id)

    if (idsToMark.length) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() } as any)
        .in('id', idsToMark)
        .eq('user_id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
