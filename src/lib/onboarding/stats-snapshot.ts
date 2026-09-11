import type { SupabaseClient } from '@supabase/supabase-js'
import { requireActiveProfile } from '@/lib/session/server'

export type OnboardingStatsSnapshot = {
  hasBaby: boolean
  hasRecording: boolean
}

export async function queryOnboardingStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<OnboardingStatsSnapshot> {
  const [{ count: babiesCount }, { count: recCount }] = await Promise.all([
    supabase
      .from('baby_parents')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', userId),
    supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })
      .eq('recorded_by', userId),
  ])

  return {
    hasBaby: (babiesCount || 0) > 0,
    hasRecording: (recCount || 0) > 0,
  }
}

export async function getOnboardingStatsForCurrentUser(): Promise<OnboardingStatsSnapshot | null> {
  try {
    const auth = await requireActiveProfile()
    if (!auth.ok) return null
    return queryOnboardingStats(auth.supabase, auth.user.id)
  } catch {
    return null
  }
}
