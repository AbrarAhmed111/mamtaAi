import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  checkLimit,
  getPlanLimits,
  incrementUsage,
  planLimitErrorResponse,
} from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('forum_threads')
      .select(`
        id,
        title,
        content,
        view_count,
        reply_count,
        like_count,
        is_pinned,
        is_locked,
        is_solved,
        tags,
        last_activity_at,
        created_at,
        author_id,
        last_reply_by,
        category:forum_categories!forum_threads_category_id_fkey (
          id,
          name,
          slug,
          icon,
          color_hex
        )
      `)
      .order('is_pinned', { ascending: false })
      .order('last_activity_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data as any[]) || []
    const authorIds = Array.from(
      new Set(rows.flatMap(t => [t.author_id, t.last_reply_by]).filter(Boolean)),
    ) as string[]
    let authors: any[] = []
    if (authorIds.length > 0) {
      const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, is_expert, is_verified, verification_data, created_at')
        .in('id', authorIds)
      if (!authorError && Array.isArray(authorData)) authors = authorData
    }
    const authorMap = new Map(authors.map(a => [a.id, a]))
    const threads = rows.map(t => ({
      ...t,
      author: authorMap.get(t.author_id) ?? null,
      last_reply_author: t.last_reply_by ? authorMap.get(t.last_reply_by) ?? null : null,
    }))

    return NextResponse.json({ threads })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

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

    const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', user.id).maybeSingle()
    const timezone = (profile as { timezone?: string } | null)?.timezone ?? null
    const planCtx = await getPlanLimits(user.id, timezone)
    const forumLimit = await checkLimit(user.id, 'create_forum_thread', { timezone })
    if (!forumLimit.allowed) return planLimitErrorResponse(forumLimit, planCtx.slug)

    const body = await request.json()
    const { title, content, category_id, tags = [] } = body

    // Strict validation
    // Title validation
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 10) {
      return NextResponse.json({ error: 'Title must be at least 10 characters' }, { status: 400 })
    }
    if (trimmedTitle.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 })
    }
    if (/[<>{}[\]\\]/.test(trimmedTitle)) {
      return NextResponse.json({ error: 'Title contains invalid characters' }, { status: 400 })
    }

    // Content validation
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    const trimmedContent = content.trim()
    if (trimmedContent.length < 50) {
      return NextResponse.json({ error: 'Content must be at least 50 characters' }, { status: 400 })
    }
    if (trimmedContent.length > 10000) {
      return NextResponse.json({ error: 'Content must be 10,000 characters or less' }, { status: 400 })
    }

    // Category validation
    if (!category_id || typeof category_id !== 'string') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(category_id)) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 })
    }
    // Verify category exists
    const { data: categoryExists } = await supabase
      .from('forum_categories')
      .select('id')
      .eq('id', category_id)
      .single()
    
    if (!categoryExists) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    }

    // Tags validation
    if (tags && Array.isArray(tags)) {
      if (tags.length > 10) {
        return NextResponse.json({ error: 'Maximum 10 tags allowed' }, { status: 400 })
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 30) {
          return NextResponse.json({ error: 'Each tag must be 30 characters or less' }, { status: 400 })
        }
        if (!/^[a-zA-Z0-9\s-]+$/.test(tag)) {
          return NextResponse.json({ error: 'Tags can only contain letters, numbers, spaces, and hyphens' }, { status: 400 })
        }
      }
    }

    const { data, error } = await supabase
      .from('forum_threads')
      .insert({
        author_id: user.id,
        title: trimmedTitle,
        content: trimmedContent,
        category_id,
        tags: tags || [],
      })
      .select(`
        *,
        category:forum_categories!forum_threads_category_id_fkey (
          id,
          name,
          slug,
          icon,
          color_hex
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    const thread = { ...(data as any), author: authorProfile ?? null }

    await incrementUsage(user.id, 'forum_threads_count', 1, timezone)
    await incrementUsage(user.id, 'forum_threads_week_count', 1, timezone)

    // Increment thread count in category
    const { data: currentCategory } = await supabase
      .from('forum_categories')
      .select('thread_count')
      .eq('id', category_id)
      .single()
    
    if (currentCategory) {
      await supabase
        .from('forum_categories')
        .update({ thread_count: (currentCategory.thread_count || 0) + 1 })
        .eq('id', category_id)
    }

    return NextResponse.json({ thread }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

