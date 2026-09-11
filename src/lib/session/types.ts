export const SESSION_INVALID_HEADER = 'x-session-invalid'

/** Why a session is no longer valid for app access */
export type SessionInvalidCode =
  | 'unauthenticated'
  | 'account_deleted'
  | 'account_suspended'

/** Profile/access fields the client watches for mid-session changes */
export type SessionAccessSnapshot = {
  role: string
  isExpert: boolean
  suspended: boolean
}

export type SessionStatusResponse =
  | {
      ok: true
      access: SessionAccessSnapshot
      subscriptionSlug: string | null
    }
  | {
      ok: false
      code: SessionInvalidCode
      message: string
    }

export type AccessChangeKind =
  | 'role_changed'
  | 'expert_revoked'
  | 'expert_granted'
  | 'admin_revoked'
  | 'admin_granted'

export function detectAccessChange(
  previous: SessionAccessSnapshot | null,
  current: SessionAccessSnapshot,
): AccessChangeKind | null {
  if (!previous) return null
  if (previous.suspended !== current.suspended) return 'role_changed'
  if (previous.role !== current.role) {
    if (previous.role === 'admin' && current.role !== 'admin') return 'admin_revoked'
    if (previous.role !== 'admin' && current.role === 'admin') return 'admin_granted'
    return 'role_changed'
  }
  if (previous.isExpert !== current.isExpert) {
    return current.isExpert ? 'expert_granted' : 'expert_revoked'
  }
  return null
}

export function accessChangeMessage(kind: AccessChangeKind): string {
  switch (kind) {
    case 'expert_granted':
      return 'Your expert access is now active. The dashboard has been updated.'
    case 'expert_revoked':
      return 'Your expert access was removed. Switched to parent view.'
    case 'admin_granted':
      return 'You now have admin access. The dashboard has been updated.'
    case 'admin_revoked':
      return 'Your admin access was removed. Switched to parent view.'
    default:
      return 'Your account access was updated.'
  }
}
