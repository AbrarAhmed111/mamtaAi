import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { queryOnboardingStats } from '@/lib/onboarding/stats-snapshot'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ hasBaby: false, hasRecording: false })
    }

    const stats = await queryOnboardingStats(supabase, user.id)

    return NextResponse.json(stats)
  } catch (e: any) {
    return NextResponse.json(
      { hasBaby: false, hasRecording: false, error: e?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}


