import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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
        category:forum_categories!forum_threads_category_id_fkey (
          id,
          name,
          slug,
          icon,
          color_hex
        ),
        author:profiles!forum_threads_author_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        last_reply_author:profiles!forum_threads_last_reply_by_fkey (
          id,
          full_name,
          avatar_url
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

    return NextResponse.json({ threads: data || [] })
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
        ),
        author:profiles!forum_threads_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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

    return NextResponse.json({ thread: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

