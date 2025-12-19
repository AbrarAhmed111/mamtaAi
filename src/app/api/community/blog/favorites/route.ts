import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get favorites from user metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Access favorite_posts from profile metadata
    const postIds = (profile && 'favorite_posts' in profile ? (profile as any).favorite_posts as string[] : []) || []

    if (postIds.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // Get the actual posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:profiles!blog_posts_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .in('id', postIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

