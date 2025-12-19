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

