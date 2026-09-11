export type ProfileDbRole = 'parent' | 'admin'

export type ProfileRoleFields = {
  role?: string | null
  is_expert?: boolean | null
  is_verified?: boolean | null
}

/** Pre-migration rows may still have role = expert until SQL is applied. */
export function isLegacyExpertRole(profile: ProfileRoleFields): boolean {
  return (profile.role || '').toLowerCase() === 'expert'
}

/** Approved expert (parent + expert). */
export function isVerifiedExpert(profile: ProfileRoleFields | null | undefined): boolean {
  if (!profile) return false
  if (profile.is_expert === true) return true
  return isLegacyExpertRole(profile) && profile.is_verified === true
}

export function isAdminAccount(profile: ProfileRoleFields | null | undefined): boolean {
  return (profile?.role || '').toLowerCase() === 'admin'
}

export function formatAccountType(
  role: string | null | undefined,
  isExpert?: boolean | null,
): string {
  if ((role || '').toLowerCase() === 'admin') return 'Admin'
  if (isExpert === true || isLegacyExpertRole({ role })) return 'Parent + Expert'
  return 'Parent'
}

export function isValidDbRole(role: string): role is ProfileDbRole {
  return role === 'parent' || role === 'admin'
}
