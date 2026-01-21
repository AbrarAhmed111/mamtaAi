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

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if already favorited
    const { data: existingFavorite } = await supabase
      .from('blog_post_favorites' as any)
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    if (existingFavorite) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 400 })
    }

    // Insert favorite into junction table (trigger will update bookmark_count automatically)
    const { error: insertError } = await supabase
      .from('blog_post_favorites' as any)
      .insert({
        post_id: id,
        user_id: user.id,
      })

    if (insertError) {
      // Handle unique constraint violation (already favorited)
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Already favorited' }, { status: 400 })
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
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

    // Delete favorite from junction table (trigger will update bookmark_count automatically)
    const { error: deleteError } = await supabase
      .from('blog_post_favorites' as any)
      .delete()
      .eq('post_id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
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

    // Check if post is favorited using junction table
    const { data: favorite } = await supabase
      .from('blog_post_favorites' as any)
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ is_favorited: !!favorite })
  } catch (e: any) {
    return NextResponse.json({ is_favorited: false })
  }
}

