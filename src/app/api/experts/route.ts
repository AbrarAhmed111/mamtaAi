import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type VerificationData = {
  professionalTitle?: string
  yearsOfExperience?: string | number
  licenseNumber?: string
}

function sanitizeExpert(row: {
  id: string
  full_name: string
  avatar_url: string | null
  verification_data: VerificationData | null
  created_at: string | null
}) {
  const vd = (row.verification_data || {}) as VerificationData
  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    professionalTitle: vd.professionalTitle?.trim() || 'Healthcare Professional',
    yearsOfExperience: vd.yearsOfExperience?.toString() || null,
    memberSince: row.created_at,
  }
}

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: expertRows, error: expertsError } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url, verification_data, created_at')
      .eq('role', 'expert')
      .eq('is_verified', true)
      .order('full_name', { ascending: true })

    if (expertsError) {
      return NextResponse.json({ error: expertsError.message }, { status: 500 })
    }

    const experts = (expertRows || []).map(sanitizeExpert)
    const expertIds = experts.map(e => e.id)

    const articleCountByExpert: Record<string, number> = {}
    if (expertIds.length > 0) {
      const { data: postRows } = await admin
        .from('blog_posts')
        .select('author_id')
        .eq('status', 'published')
        .in('author_id', expertIds)

      for (const row of postRows || []) {
        const authorId = String(row.author_id)
        articleCountByExpert[authorId] = (articleCountByExpert[authorId] || 0) + 1
      }
    }

    const [{ data: postRows, error: postsError }, { count: expertArticleCount }] = await Promise.all([
      admin
        .from('blog_posts')
        .select('id, title, excerpt, category, published_at, is_expert_content, author_id')
        .eq('status', 'published')
        .eq('is_expert_content', true)
        .order('published_at', { ascending: false })
        .limit(6),
      admin
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('is_expert_content', true),
    ])

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    const authorIds = [...new Set((postRows || []).map(p => p.author_id).filter(Boolean))]
    const authorById: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {}

    if (authorIds.length > 0) {
      const { data: authors } = await admin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', authorIds)

      for (const author of authors || []) {
        authorById[author.id] = author
      }
    }

    const expertPosts = (postRows || []).map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      published_at: post.published_at,
      is_expert_content: post.is_expert_content,
      author: authorById[post.author_id] ?? null,
    }))

    const expertsWithCounts = experts.map(expert => ({
      ...expert,
      articleCount: articleCountByExpert[expert.id] || 0,
    }))

    return NextResponse.json({
      experts: expertsWithCounts,
      stats: {
        verifiedExperts: expertsWithCounts.length,
        expertArticles: expertArticleCount ?? 0,
        specialties: new Set(
          expertsWithCounts.map(e => e.professionalTitle).filter(Boolean),
        ).size,
      },
      expertPosts: expertPosts || [],
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
