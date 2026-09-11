import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi, getAdminDb, writeAuditLog } from '@/lib/admin'

export const dynamic = 'force-dynamic'

type RouteCtx = { params: Promise<{ type: string; id: string }> }

const TABLE_MAP: Record<string, string> = {
  blog: 'blog_posts',
  blog_post: 'blog_posts',
  blog_comment: 'blog_comments',
  comment: 'blog_comments',
  forum: 'forum_threads',
  forum_thread: 'forum_threads',
  reply: 'forum_replies',
  forum_reply: 'forum_replies',
}

function reportTypeForTable(table: string): string {
  if (table === 'blog_posts') return 'blog_post'
  if (table === 'blog_comments') return 'blog_comment'
  if (table === 'forum_threads') return 'forum_thread'
  return 'forum_reply'
}

export async function DELETE(request: NextRequest, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { type, id } = await params
  const table = TABLE_MAP[type]
  if (!table) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  const db = getAdminDb()
  const { data: existing } = await (db as any).from(table).select('*').eq('id', id).maybeSingle()

  const { error } = await (db as any).from(table).delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const reportType = reportTypeForTable(table)

  await (db as any)
    .from('content_reports')
    .update({
      status: 'removed',
      reviewed_by: auth.admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('content_type', reportType)
    .eq('content_id', id)

  await writeAuditLog({
    adminId: auth.admin.id,
    action: 'content_remove',
    entityType: reportType,
    entityId: id,
    oldValues: existing ?? null,
    metadata: { table },
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { type, id } = await params
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')

  if (!['dismiss', 'resolve'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const reportType =
    type === 'blog_comment' || type === 'comment'
      ? 'blog_comment'
      : type.includes('blog')
        ? 'blog_post'
        : type.includes('reply')
          ? 'forum_reply'
          : 'forum_thread'
  const contentType = reportType

  const db = getAdminDb()
  const { error } = await (db as any)
    .from('content_reports')
    .update({
      status: action === 'dismiss' ? 'dismissed' : 'reviewed',
      reviewed_by: auth.admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await writeAuditLog({
    adminId: auth.admin.id,
    action: `report_${action}`,
    entityType: contentType,
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
