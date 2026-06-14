import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { isVerifiedExpert } from '@/lib/expert/active-view'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_expert, is_verified, verification_data, created_at')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !isVerifiedExpert(profile)) {
      return NextResponse.json({ error: 'Verified expert required' }, { status: 403 })
    }

    const vd = (profile.verification_data || {}) as Record<string, unknown>

    const [{ count: articleCount }, { count: forumReplyCount }] = await Promise.all([
      (supabaseAdmin as any)
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('status', 'published'),
      (supabaseAdmin as any)
        .from('forum_replies')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', user.id),
    ])

    return NextResponse.json({
      stats: {
        profileViews: Number(vd.profileViews ?? 0),
        articlesPublished: articleCount ?? 0,
        communityReplies: forumReplyCount ?? 0,
      },
      quickLinks: {
        profile: '/dashboard/expert/profile',
        articles: '/dashboard/expert/articles',
        directoryListing: '/dashboard/experts',
      },
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load stats' },
      { status: 500 },
    )
  }
}
