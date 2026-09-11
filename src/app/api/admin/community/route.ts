import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi, getAdminDb, writeAuditLog } from '@/lib/admin'

export const dynamic = 'force-dynamic'

async function loadContentPreview(
  db: ReturnType<typeof getAdminDb>,
  contentType: string,
  contentId: string,
) {
  if (contentType === 'blog_post') {
    const { data } = await (db as any)
      .from('blog_posts')
      .select('id, title, status, author_id, created_at')
      .eq('id', contentId)
      .maybeSingle()
    return data ? { ...data, preview: data.title } : null
  }
  if (contentType === 'forum_thread') {
    const { data } = await (db as any)
      .from('forum_threads')
      .select('id, title, author_id, created_at')
      .eq('id', contentId)
      .maybeSingle()
    return data ? { ...data, preview: data.title } : null
  }
  if (contentType === 'forum_reply') {
    const { data } = await (db as any)
      .from('forum_replies')
      .select('id, content, author_id, created_at')
      .eq('id', contentId)
      .maybeSingle()
    return data
      ? { ...data, preview: String(data.content || '').slice(0, 120) }
      : null
  }
  if (contentType === 'blog_comment') {
    const { data } = await (db as any)
      .from('blog_comments')
      .select('id, content, author_id, created_at')
      .eq('id', contentId)
      .maybeSingle()
    return data
      ? { ...data, preview: String(data.content || '').slice(0, 120) }
      : null
  }
  return null
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const status = request.nextUrl.searchParams.get('status') || 'pending'
  const db = getAdminDb()

  const { data, error } = await (db as any)
    .from('content_reports')
    .select(
      `
      id,
      content_type,
      content_id,
      reason,
      status,
      created_at,
      reporter:profiles!content_reports_reported_by_fkey(full_name)
    `,
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message, items: [] }, { status: 200 })
  }

  const items = await Promise.all(
    (data || []).map(async (row: Record<string, unknown>) => {
      const content = await loadContentPreview(
        db,
        String(row.content_type),
        String(row.content_id),
      )
      return {
        id: row.id,
        contentType: row.content_type,
        contentId: row.content_id,
        reason: row.reason,
        status: row.status,
        createdAt: row.created_at,
        reporterName: (row.reporter as { full_name?: string })?.full_name ?? 'Anonymous',
        contentPreview: content?.preview ?? '(content unavailable)',
        contentMeta: content,
      }
    }),
  )

  return NextResponse.json({ items })
}
