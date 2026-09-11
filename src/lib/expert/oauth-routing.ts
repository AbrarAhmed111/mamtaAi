import { supabaseAdmin } from '@/lib/supabase/client'
import { isLegacyExpertRole, type ProfileRoleFields } from './profile-role'

function readMetadata(profile: ProfileRoleFields & { metadata?: unknown }): Record<string, unknown> | null {
  if (!profile.metadata || typeof profile.metadata !== 'object' || Array.isArray(profile.metadata)) {
    return null
  }
  return profile.metadata as Record<string, unknown>
}

async function latestExpertApplicationStatus(userId: string): Promise<string | null> {
  const { data } = await (supabaseAdmin as any)
    .from('expert_applications')
    .select('status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.status as string) ?? null
}

/** Resolve post-OAuth redirect before sending the user to the dashboard. */
export async function resolveOAuthPostLoginPath(
  userId: string,
  profile: (ProfileRoleFields & { metadata?: unknown }) | null,
): Promise<string | null> {
  if (!profile?.role) {
    return '/auth/role'
  }

  const applicationStatus = await latestExpertApplicationStatus(userId)
  if (applicationStatus === 'pending') {
    return '/onboarding?status=pending'
  }

  const meta = readMetadata(profile)
  const expertIntent = meta?.expert_application_intent === true
  const legacyUnverifiedExpert = isLegacyExpertRole(profile) && profile.is_verified !== true
  const needsExpertApplication =
    applicationStatus !== 'approved' &&
    (expertIntent || legacyUnverifiedExpert) &&
    applicationStatus !== 'pending'

  if (needsExpertApplication) {
    return '/auth/expert-application'
  }

  return null
}
