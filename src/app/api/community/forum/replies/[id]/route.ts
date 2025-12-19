import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PATCH(
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
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Check if reply exists and user is the author
    const { data: reply } = await supabase
      .from('forum_replies')
      .select('author_id, thread_id')
      .eq('id', id)
      .single()

    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    if (reply.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('forum_replies')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        author:profiles!forum_replies_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reply: data })
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

    // Check if reply exists and user is the author
    const { data: reply } = await supabase
      .from('forum_replies')
      .select('author_id, thread_id')
      .eq('id', id)
      .single()

    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    if (reply.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the reply
    const { error } = await supabase
      .from('forum_replies')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Decrement reply count on thread
    const { data: currentThread } = await supabase
      .from('forum_threads')
      .select('reply_count')
      .eq('id', reply.thread_id)
      .single()
    
    if (currentThread) {
      await supabase
        .from('forum_threads')
        .update({ reply_count: Math.max(0, (currentThread.reply_count || 0) - 1) })
        .eq('id', reply.thread_id)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


