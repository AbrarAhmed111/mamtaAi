import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 30)))

  const { data: postsData, error } = await (supabaseAdmin as any)
    .from('blog_posts')
    .select(`
      id,
      title,
      excerpt,
      created_at,
      published_at,
      author_id
    `)
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const authorIds = Array.from(
    new Set(((postsData as any[]) || []).map(post => post.author_id).filter(Boolean)),
  ) as string[]

  let authors: any[] = []
  if (authorIds.length > 0) {
    const { data: authorData, error: authorError } = await (supabaseAdmin as any)
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds)

    if (!authorError && Array.isArray(authorData)) {
      authors = authorData
    }
  }

  const authorMap = new Map(authors.map(author => [author.id, author]))

  return NextResponse.json({
    posts: ((postsData as any[]) || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      authorName: authorMap.get(post.author_id)?.full_name ?? null,
      createdAt: post.published_at ?? post.created_at,
    })),
  })
}

