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

    // Get user profile with favorite_posts (using metadata as fallback)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Access favorite_posts from profile metadata or use empty array
    const favoritePosts = (profile && 'favorite_posts' in profile ? (profile as any).favorite_posts as string[] : []) || []
    
    // Check if already favorited
    if (favoritePosts.includes(id)) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 400 })
    }

    // Add to favorites in user metadata
    const updatedFavorites = [...favoritePosts, id]
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ favorite_posts: updatedFavorites } as any)
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Increment bookmark count on post
    const { data: post } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (post) {
      const currentCount = (post && 'bookmark_count' in post ? (post as any).bookmark_count : 0) || 0
      await supabase
        .from('blog_posts')
        .update({ bookmark_count: currentCount + 1 } as any)
        .eq('id', id)
    }

    return NextResponse.json({ favorited: true })
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

    // Get user profile with favorite_posts
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Access favorite_posts from profile metadata
    const currentFavorites = (profile && 'favorite_posts' in profile ? (profile as any).favorite_posts as string[] : []) || []
    
    if (!currentFavorites.length || !currentFavorites.includes(id)) {
      return NextResponse.json({ favorited: false })
    }

    // Remove from favorites in user metadata
    const favoritePosts = currentFavorites.filter((pid: string) => pid !== id)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ favorite_posts: favoritePosts } as any)
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Decrement bookmark count on post
    const { data: post } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (post) {
      const currentCount = (post && 'bookmark_count' in post ? (post as any).bookmark_count : 0) || 0
      await supabase
        .from('blog_posts')
        .update({ bookmark_count: Math.max(0, currentCount - 1) } as any)
        .eq('id', id)
    }

    return NextResponse.json({ favorited: false })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function GET(
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
      return NextResponse.json({ is_favorited: false })
    }

    const { id } = await params

    // Check user metadata for favorites
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Access favorite_posts from profile metadata
    const favoritePosts = (profile && 'favorite_posts' in profile ? (profile as any).favorite_posts as string[] : []) || []
    const isFavorited = favoritePosts.includes(id)

    return NextResponse.json({ is_favorited: isFavorited })
  } catch (e: any) {
    return NextResponse.json({ is_favorited: false })
  }
}

