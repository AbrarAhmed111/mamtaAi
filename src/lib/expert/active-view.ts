import type {
  ActiveViewPreference,
  AdminDashboardView,
  DashboardActiveView,
} from './constants'
import { isAdminAccount, isVerifiedExpert } from './profile-role'

export { isAdminAccount, isVerifiedExpert, formatAccountType } from './profile-role'

type ProfileLike = {
  role?: string | null
  is_expert?: boolean | null
  is_verified?: boolean | null
  active_view?: string | null
  metadata?: unknown
}

function readMetadata(profile: ProfileLike): Record<string, unknown> | null {
  if (!profile.metadata || typeof profile.metadata !== 'object' || Array.isArray(profile.metadata)) {
    return null
  }
  return profile.metadata as Record<string, unknown>
}

function readActiveViewPreference(profile: ProfileLike): ActiveViewPreference {
  if (profile.active_view === 'expert' || profile.active_view === 'parent') {
    return profile.active_view
  }
  const meta = readMetadata(profile)
  const fromMeta = meta?.active_view ?? meta?.activeView
  if (fromMeta === 'expert' || fromMeta === 'parent') return fromMeta
  return 'parent'
}

export function readAdminDashboardView(profile: ProfileLike): AdminDashboardView {
  const meta = readMetadata(profile)
  const fromMeta = meta?.admin_dashboard_view ?? meta?.adminDashboardView
  if (fromMeta === 'parent') return 'parent'
  return 'admin'
}

/** Which dashboard shell the user should see right now (preference, not route override). */
export function getActiveView(profile: ProfileLike | null | undefined): DashboardActiveView {
  if (!profile) return 'parent'
  if (isAdminAccount(profile)) {
    return readAdminDashboardView(profile) === 'parent' ? 'parent' : 'admin'
  }
  if (isVerifiedExpert(profile)) {
    return readActiveViewPreference(profile) === 'parent' ? 'parent' : 'expert'
  }
  return 'parent'
}

/** Sidebar/nav view — admin routes always show admin nav even when previewing parent elsewhere. */
export function getSidebarView(
  profile: ProfileLike | null | undefined,
  pathname: string | null | undefined,
): DashboardActiveView {
  const preference = getActiveView(profile)
  if (isAdminAccount(profile) && pathname?.startsWith('/dashboard/admin')) {
    return 'admin'
  }
  return preference
}

export function getAdminDashboardViewPreference(
  profile: ProfileLike | null | undefined,
): AdminDashboardView {
  if (!profile) return 'admin'
  return readAdminDashboardView(profile)
}

export function getExpertViewPreference(
  profile: ProfileLike | null | undefined,
): ActiveViewPreference {
  if (!profile) return 'parent'
  return readActiveViewPreference(profile)
}
