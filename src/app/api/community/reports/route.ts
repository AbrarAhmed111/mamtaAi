import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { notifyAdminsOfContentReport } from '@/lib/notifications/admin-notifications'

export const dynamic = 'force-dynamic'

const CONTENT_TYPES = ['blog_post', 'forum_thread', 'forum_reply', 'blog_comment'] as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const contentType = String(body.contentType || body.content_type || '').trim()
    const contentId = String(body.contentId || body.content_id || '').trim()
    const reason = body.reason ? String(body.reason).trim().slice(0, 500) : null

    if (!CONTENT_TYPES.includes(contentType as (typeof CONTENT_TYPES)[number])) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }
    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 })
    }

    const { data: reporterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const { data: report, error: insertError } = await (supabaseAdmin as any)
      .from('content_reports')
      .insert({
        content_type: contentType,
        content_id: contentId,
        reported_by: user.id,
        reason,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    notifyAdminsOfContentReport({
      reportId: report.id,
      contentType,
      contentId,
      reason,
      reporterName: reporterProfile?.full_name || 'A user',
    })

    return NextResponse.json({ ok: true, reportId: report.id }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to submit report' },
      { status: 500 },
    )
  }
}
