import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'
import { checkLimit, getPlanLimits, incrementUsage, planLimitErrorResponse } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const title = String(body.title || '').trim()
  const content = String(body.content || '').trim()
  const category = String(body.category || 'Tips').trim()

  if (title.length < 10) return NextResponse.json({ error: 'Title must be at least 10 characters' }, { status: 400 })
  if (content.length < 100) return NextResponse.json({ error: 'Content must be at least 100 characters' }, { status: 400 })

  const timezone = auth.auth.profile?.timezone ?? null
  const planCtx = await getPlanLimits(auth.auth.user.id, timezone)
  const blogLimit = await checkLimit(auth.auth.user.id, 'create_blog_post', { timezone })
  if (!blogLimit.allowed) return planLimitErrorResponse(blogLimit, planCtx.slug)

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100)
  const { data, error } = await (supabaseAdmin as any)
    .from('blog_posts')
    .insert({
      author_id: auth.auth.user.id,
      title,
      slug: `${slug}-${Date.now()}`,
      content,
      excerpt: String(body.excerpt || content.slice(0, 200)),
      category,
      age_group: body.age_group || 'all',
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : [],
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await incrementUsage(auth.auth.user.id, 'blog_posts_count', 1, timezone)
  return NextResponse.json({ post: data }, { status: 201 })
}

