import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    // Check if this is a view increment request (only increment once per session)
    const { searchParams } = new URL(request.url)
    const shouldIncrementView = searchParams.get('increment_view') === 'true'

    // Only increment view count if explicitly requested (first load only)
    if (shouldIncrementView) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Check if user has already viewed this post (to prevent duplicate views)
      let shouldIncrement = false

      if (user) {
        // For logged-in users: check if they've viewed this post before
        // Try to use blog_post_views table if it exists, otherwise use cookie as fallback
        try {
          const { data: existingView } = await supabase
            .from('blog_post_views' as any)
            .select('id')
            .eq('post_id', id)
            .eq('viewer_id', user.id)
            .maybeSingle()

          if (!existingView) {
            shouldIncrement = true
          }
        } catch (error) {
          // Table doesn't exist, fall back to cookie-based approach
          const viewCookie = request.cookies.get(`blog_view_${id}_${user.id}`)
          if (!viewCookie) {
            shouldIncrement = true
          }
        }
      } else {
        // For anonymous users, use cookie-based approach
        const viewCookie = request.cookies.get(`blog_view_${id}`)
        if (!viewCookie) {
          shouldIncrement = true
        }
      }

      if (shouldIncrement) {
        // Increment view count
        const { data: currentPost } = await supabase
          .from('blog_posts')
          .select('view_count')
          .eq('id', id)
          .single()
        
        if (currentPost) {
          await supabase
            .from('blog_posts')
            .update({ view_count: (currentPost.view_count || 0) + 1 })
            .eq('id', id)

          // Try to record the view in blog_post_views table (if it exists)
          if (user) {
            try {
              await supabase
                .from('blog_post_views' as any)
                .insert({
                  post_id: id,
                  viewer_id: user.id,
                })
            } catch (error) {
              // Table doesn't exist, that's okay - we'll use cookies
            }
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:profiles!blog_posts_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const response = NextResponse.json({ post: data })
    
    // Set cookie to prevent duplicate views (works for both logged-in and anonymous users)
    if (shouldIncrementView) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      // Use user-specific cookie for logged-in users, generic for anonymous
      const cookieName = user ? `blog_view_${id}_${user.id}` : `blog_view_${id}`
      
      response.cookies.set(cookieName, '1', {
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: false, // Allow client-side access
        sameSite: 'lax',
        path: '/',
      })
    }

    return response
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

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

    // Check if user is the author
    const { data: post } = await supabase
      .from('blog_posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!post || post.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
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
    const { data: post } = await supabase
      .from('blog_posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!post || post.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('blog_posts')
      .update({ status: 'deleted' })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

