import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'
import { checkLimit, getPlanLimits, incrementUsage, planLimitErrorResponse } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')
  let query = (supabaseAdmin as any)
    .from('forum_threads')
    .select(`
      id,
      title,
      content,
      reply_count,
      like_count,
      is_pinned,
      is_solved,
      created_at,
      category:forum_categories!forum_threads_category_id_fkey ( id, name, slug ),
      author:profiles!forum_threads_author_id_fkey ( id, full_name, avatar_url )
    `)
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })
    .limit(50)

  if (categoryId) query = query.eq('category_id', categoryId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ threads: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const title = String(body.title || '').trim()
  const content = String(body.content || '').trim()
  const categoryId = String(body.categoryId || body.category_id || '').trim()

  if (title.length < 10) return NextResponse.json({ error: 'Title must be at least 10 characters' }, { status: 400 })
  if (content.length < 50) return NextResponse.json({ error: 'Content must be at least 50 characters' }, { status: 400 })
  if (!categoryId) return NextResponse.json({ error: 'Category is required' }, { status: 400 })

  const timezone = auth.auth.profile?.timezone ?? null
  const planCtx = await getPlanLimits(auth.auth.user.id, timezone)
  const forumLimit = await checkLimit(auth.auth.user.id, 'create_forum_thread', { timezone })
  if (!forumLimit.allowed) return planLimitErrorResponse(forumLimit, planCtx.slug)

  const { data, error } = await (supabaseAdmin as any)
    .from('forum_threads')
    .insert({
      author_id: auth.auth.user.id,
      category_id: categoryId,
      title,
      content,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : [],
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await incrementUsage(auth.auth.user.id, 'forum_threads_count', 1, timezone)
  await incrementUsage(auth.auth.user.id, 'forum_threads_week_count', 1, timezone)
  return NextResponse.json({ thread: data }, { status: 201 })
}

