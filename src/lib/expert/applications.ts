import { EXPERT_REAPPLY_COOLDOWN_MS, type ExpertApplicationStatus } from './constants'
import { isLegacyExpertRole, isVerifiedExpert, type ProfileRoleFields } from './profile-role'

export type ExpertApplicationRow = {
  id: string
  user_id: string
  specialization: string
  professional_title: string
  license_number: string
  years_experience: number
  bio: string | null
  document_url: string
  document_name: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  can_reapply_after: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export function applicationStatusForUser(
  application: ExpertApplicationRow | null,
  profile: ProfileRoleFields & { verification_data?: unknown },
): ExpertApplicationStatus {
  if (isVerifiedExpert(profile)) return 'approved'
  if (application) return application.status
  if (isLegacyExpertRole(profile) && !profile.is_verified) {
    return 'pending'
  }
  const vd = profile.verification_data
  if (
    vd &&
    typeof vd === 'object' &&
    !Array.isArray(vd) &&
    (vd as Record<string, unknown>).professionalTitle
  ) {
    return 'pending'
  }
  return 'none'
}

export function canSubmitExpertApplication(
  application: ExpertApplicationRow | null,
  profile: ProfileRoleFields,
): { ok: boolean; reason?: string; reapplyAt?: string } {
  if (isVerifiedExpert(profile)) {
    return { ok: false, reason: 'You are already a verified expert.' }
  }
  if (application?.status === 'pending') {
    return { ok: false, reason: 'Your application is already under review.' }
  }
  if (application?.status === 'rejected' && application.can_reapply_after) {
    const reapplyAt = new Date(application.can_reapply_after)
    if (reapplyAt.getTime() > Date.now()) {
      return {
        ok: false,
        reason: 'You can re-apply after the cooldown period.',
        reapplyAt: application.can_reapply_after,
      }
    }
  }
  return { ok: true }
}

export function reapplyCooldownEndsAt(from = new Date()): string {
  return new Date(from.getTime() + EXPERT_REAPPLY_COOLDOWN_MS).toISOString()
}

export function formatReapplyCountdown(reapplyAt: string): string {
  const ms = new Date(reapplyAt).getTime() - Date.now()
  if (ms <= 0) return 'now'
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} and ${hours} hour${hours === 1 ? '' : 's'}`
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${minutes === 1 ? '' : 's'}`
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

export function verificationDataFromApplication(app: ExpertApplicationRow) {
  return {
    professionalTitle: app.professional_title,
    specialization: app.specialization,
    licenseNumber: app.license_number,
    yearsOfExperience: String(app.years_experience),
    bio: app.bio,
    documentUrl: app.document_url,
    documentName: app.document_name,
    approvedAt: new Date().toISOString(),
  }
}
