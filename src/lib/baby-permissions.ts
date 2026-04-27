export type BabyAccessLevel = 'full' | 'read_only' | 'limited'

export interface BabyMembershipPermissions {
  baby_id: string
  parent_id: string
  relationship: string | null
  access_level: BabyAccessLevel | string | null
  can_edit_profile: boolean | null
  can_record_audio: boolean | null
  can_view_history: boolean | null
  is_primary: boolean | null
}

export function canEditBabyProfile(m: BabyMembershipPermissions | null | undefined): boolean {
  return Boolean(m?.can_edit_profile)
}

export function canRecordForBaby(m: BabyMembershipPermissions | null | undefined): boolean {
  if (!m) return false
  if (m.can_record_audio === false) return false
  return true
}

export function canDeleteBaby(m: BabyMembershipPermissions | null | undefined): boolean {
  return Boolean(m?.can_edit_profile)
}

export function canDeleteActivities(m: BabyMembershipPermissions | null | undefined): boolean {
  return Boolean(m?.can_edit_profile)
}

/** Label for badge: Primary, Full Access, or Read Only */
export function accessBadgeLabel(m: BabyMembershipPermissions | null | undefined): string {
  if (!m) return ''
  if (m.is_primary) return 'Primary'
  if (m.access_level === 'full' || m.can_edit_profile) return 'Full Access'
  return 'Read Only'
}

export function isRelativeRole(relationship: string | null | undefined): boolean {
  const r = (relationship || '').toLowerCase()
  return ['guardian', 'caregiver', 'grandparent', 'other'].includes(r)
}
