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

    if (!title || !content || !category_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('forum_threads')
      .insert({
        author_id: user.id,
        title,
        content,
        category_id,
        tags,
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

