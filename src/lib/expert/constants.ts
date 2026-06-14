export const EXPERT_REAPPLY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export const EXPERT_NEW_BADGE_DAYS = 7

export type ExpertApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected'

export type DashboardActiveView = 'admin' | 'expert' | 'parent'

export type ActiveViewPreference = 'parent' | 'expert'

/** Admin-only: admin panel vs end-user (parent) dashboard preview. */
export type AdminDashboardView = 'admin' | 'parent'
