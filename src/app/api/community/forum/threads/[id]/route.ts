import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    // Increment view count
    const { data: currentThread } = await supabase
      .from('forum_threads')
      .select('view_count')
      .eq('id', id)
      .single()
    
    if (currentThread) {
      await supabase
        .from('forum_threads')
        .update({ view_count: (currentThread.view_count || 0) + 1 })
        .eq('id', id)
    }

    const { data, error } = await supabase
      .from('forum_threads')
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
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    return NextResponse.json({ thread: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is the author
    const { data: thread } = await supabase
      .from('forum_threads')
      .select('author_id, category_id')
      .eq('id', id)
      .single()

    if (!thread || thread.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the thread
    const { error } = await supabase
      .from('forum_threads')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Decrement thread count in category
    const { data: currentCategory } = await supabase
      .from('forum_categories')
      .select('thread_count')
      .eq('id', thread.category_id)
      .single()
    
    if (currentCategory) {
      await supabase
        .from('forum_categories')
        .update({ thread_count: Math.max(0, (currentCategory.thread_count || 0) - 1) })
        .eq('id', thread.category_id)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

