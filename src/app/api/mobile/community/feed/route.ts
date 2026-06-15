import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 30)))

  const { data, error } = await (supabaseAdmin as any)
    .from('blog_posts')
    .select(`
      id,
      title,
      excerpt,
      created_at,
      published_at,
      author:profiles!blog_posts_author_id_fkey ( full_name )
    `)
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    posts: (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      authorName: post.author?.full_name ?? null,
      createdAt: post.published_at ?? post.created_at,
    })),
  })
}

