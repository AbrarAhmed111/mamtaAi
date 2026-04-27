import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { notifyForumReplyCommunityNotifications } from '@/lib/notifications/community-notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('forum_replies')
      .select(`
        *,
        author:profiles!forum_replies_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('thread_id', id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })
      .order('parent_reply_id', { ascending: true, nullsFirst: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ replies: data || [] })
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
    const { content, parent_reply_id } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Check if thread is locked
    const { data: thread } = await supabase
      .from('forum_threads')
      .select('is_locked')
      .eq('id', id)
      .single()

    if (thread?.is_locked) {
      return NextResponse.json({ error: 'Thread is locked' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('forum_replies')
      .insert({
        thread_id: id,
        author_id: user.id,
        content,
        parent_reply_id: parent_reply_id || null,
      })
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

    // Increment reply count on thread
    const { data: currentThread } = await supabase
      .from('forum_threads')
      .select('reply_count')
      .eq('id', id)
      .single()
    
    if (currentThread) {
      await supabase
        .from('forum_threads')
        .update({ reply_count: (currentThread.reply_count || 0) + 1 })
        .eq('id', id)
    }

    const { data: threadMeta } = await supabase
      .from('forum_threads')
      .select('author_id, title')
      .eq('id', id)
      .maybeSingle()

    let parentAuthorId: string | null = null
    if (parent_reply_id) {
      const { data: parentRow } = await supabase
        .from('forum_replies')
        .select('author_id')
        .eq('id', parent_reply_id)
        .maybeSingle()
      parentAuthorId = (parentRow as { author_id?: string } | null)?.author_id ?? null
    }

    const replierName =
      typeof (data as { author?: { full_name?: string } })?.author?.full_name === 'string'
        ? String((data as { author?: { full_name?: string } }).author?.full_name).trim() || 'Someone'
        : 'Someone'

    if (threadMeta?.author_id) {
      notifyForumReplyCommunityNotifications({
        threadId: id,
        threadTitle: String((threadMeta as { title?: string }).title || 'Discussion'),
        threadAuthorId: String((threadMeta as { author_id: string }).author_id),
        replierId: user.id,
        replierName,
        replyId: String((data as { id: string }).id),
        content: String(content),
        parentReplyId: parent_reply_id ? String(parent_reply_id) : null,
        parentAuthorId,
      })
    }

    return NextResponse.json({ reply: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

