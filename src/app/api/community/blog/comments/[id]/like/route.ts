import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('blog_comments')
      .select('id')
      .eq('id', id)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user has already liked this comment
    const { data: existingLike } = await supabase
      .from('blog_comment_likes')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // User has already liked, so unlike (delete)
      const { error: deleteError } = await supabase
        .from('blog_comment_likes')
        .delete()
        .eq('comment_id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Get updated like count (trigger has updated it)
      const { data: updatedComment } = await supabase
        .from('blog_comments')
        .select('like_count')
        .eq('id', id)
        .single()

      return NextResponse.json({ like_count: updatedComment?.like_count || 0, liked: false })
    }

    // Insert like into junction table (trigger will update like_count automatically)
    const { error: insertError } = await supabase
      .from('blog_comment_likes')
      .insert({
        comment_id: id,
        user_id: user.id,
      })

    if (insertError) {
      // Handle unique constraint violation (already liked)
      if (insertError.code === '23505') {
        // Try to delete instead
        const { error: deleteError } = await supabase
          .from('blog_comment_likes')
          .delete()
          .eq('comment_id', id)
          .eq('user_id', user.id)

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        const { data: updatedComment } = await supabase
          .from('blog_comments')
          .select('like_count')
          .eq('id', id)
          .single()

        return NextResponse.json({ like_count: updatedComment?.like_count || 0, liked: false })
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Get updated like count (trigger has updated it)
    const { data: updatedComment } = await supabase
      .from('blog_comments')
      .select('like_count')
      .eq('id', id)
      .single()

    return NextResponse.json({ like_count: updatedComment?.like_count || 0, liked: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}



