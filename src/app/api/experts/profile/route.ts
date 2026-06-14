import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { isVerifiedExpert } from '@/lib/expert/active-view'
import { EXPERT_NEW_BADGE_DAYS } from '@/lib/expert/constants'

export const dynamic = 'force-dynamic'

function isNewExpert(approvedAt: string | null | undefined): boolean {
  if (!approvedAt) return false
  const ms = Date.now() - new Date(approvedAt).getTime()
  return ms >= 0 && ms <= EXPERT_NEW_BADGE_DAYS * 24 * 60 * 60 * 1000
}

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
      .select('id, full_name, avatar_url, role, is_verified, verification_data, created_at')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !isVerifiedExpert(profile)) {
      return NextResponse.json({ error: 'Verified expert profile required' }, { status: 403 })
    }

    const vd = (profile.verification_data || {}) as Record<string, unknown>
    const approvedAt = (vd.approvedAt as string) || profile.created_at

    const { count: articleCount } = await (supabaseAdmin as any)
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .eq('status', 'published')

    return NextResponse.json({
      profile: {
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        professionalTitle: vd.professionalTitle || vd.professional_title || '',
        specialization: vd.specialization || '',
        licenseNumber: vd.licenseNumber || vd.license_number || '',
        yearsOfExperience: vd.yearsOfExperience || vd.years_of_experience || '',
        bio: vd.bio || '',
        isNewExpert: isNewExpert(approvedAt),
        approvedAt,
      },
      stats: {
        articlesPublished: articleCount ?? 0,
        profileViews: Number(vd.profileViews ?? 0),
      },
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load profile' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
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
      .select('role, is_verified, verification_data')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !isVerifiedExpert(profile)) {
      return NextResponse.json({ error: 'Verified expert profile required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const existing = (profile.verification_data || {}) as Record<string, unknown>
    const next = { ...existing }

    if (body.professionalTitle !== undefined) {
      next.professionalTitle = String(body.professionalTitle).trim().slice(0, 120)
    }
    if (body.specialization !== undefined) {
      next.specialization = String(body.specialization).trim().slice(0, 120)
    }
    if (body.bio !== undefined) {
      next.bio = String(body.bio).trim().slice(0, 2000)
    }
    if (body.yearsOfExperience !== undefined) {
      next.yearsOfExperience = String(body.yearsOfExperience).trim().slice(0, 10)
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        verification_data: next as never,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('verification_data, full_name, avatar_url')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, profile: updated })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update profile' },
      { status: 500 },
    )
  }
}
