import { EXPERT_NEW_BADGE_DAYS } from './constants'
import { isVerifiedExpert, type ProfileRoleFields } from './profile-role'

export type VerificationData = {
  professionalTitle?: string
  professional_title?: string
  approvedAt?: string
}

export type CommunityAuthorProfile = ProfileRoleFields & {
  id: string
  full_name: string
  avatar_url: string | null
  verification_data?: VerificationData | Record<string, unknown> | null
  created_at?: string | null
}

/** Fields to include in Supabase nested profile selects for community authors. */
export const COMMUNITY_AUTHOR_PROFILE_FIELDS = [
  'id',
  'full_name',
  'avatar_url',
  'role',
  'is_expert',
  'is_verified',
  'verification_data',
  'created_at',
] as const

export function getExpertApprovedAt(profile: CommunityAuthorProfile): string | null {
  const vd = (profile.verification_data || {}) as VerificationData
  return vd.approvedAt || profile.created_at || null
}

export function isNewExpertProfile(profile: CommunityAuthorProfile | null | undefined): boolean {
  if (!isVerifiedExpert(profile)) return false
  const approvedAt = getExpertApprovedAt(profile!)
  if (!approvedAt) return false
  const ms = Date.now() - new Date(approvedAt).getTime()
  return ms >= 0 && ms <= EXPERT_NEW_BADGE_DAYS * 24 * 60 * 60 * 1000
}

export function getProfessionalTitle(profile: CommunityAuthorProfile | null | undefined): string | null {
  if (!isVerifiedExpert(profile)) return null
  const vd = (profile!.verification_data || {}) as VerificationData
  const title = vd.professionalTitle || vd.professional_title
  return typeof title === 'string' && title.trim() ? title.trim() : null
}

export function isExpertAuthor(profile: CommunityAuthorProfile | null | undefined): boolean {
  return isVerifiedExpert(profile)
}

export function shouldLabelPostAsExpert(
  isExpertContent: boolean | null | undefined,
  author: CommunityAuthorProfile | null | undefined,
): boolean {
  return Boolean(isExpertContent) || isExpertAuthor(author)
}
