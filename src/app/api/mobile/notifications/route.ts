import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { data, error } = await (supabaseAdmin as any)
    .from('notifications')
    .select('id, title, body, is_read, created_at')
    .eq('user_id', auth.auth.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    notifications: (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      isRead: item.is_read,
      createdAt: item.created_at,
    })),
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response
  const body = await request.json().catch(() => ({}))
  const id = body.id ? String(body.id) : null

  let query = (supabaseAdmin as any)
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', auth.auth.user.id)

  if (id) query = query.eq('id', id)
  else query = query.eq('is_read', false)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

