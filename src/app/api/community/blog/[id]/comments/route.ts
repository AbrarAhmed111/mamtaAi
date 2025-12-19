import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('blog_comments')
      .select(`
        *,
        author:profiles!blog_comments_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })
      .order('parent_comment_id', { ascending: true, nullsFirst: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(
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
    const body = await request.json()
    const { content, parent_comment_id } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: id,
        author_id: user.id,
        content,
        parent_comment_id: parent_comment_id || null,
      })
      .select(`
        *,
        author:profiles!blog_comments_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Increment comment count on post
    const { data: currentPost } = await supabase
      .from('blog_posts')
      .select('comment_count')
      .eq('id', id)
      .single()
    
    if (currentPost) {
      await supabase
        .from('blog_posts')
        .update({ comment_count: (currentPost.comment_count || 0) + 1 })
        .eq('id', id)
    }

    return NextResponse.json({ comment: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

