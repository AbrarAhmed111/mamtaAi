import { supabaseAdmin } from '@/lib/supabase/client'
import { recommendedUpgrade } from './plans'
import {
  getPlanLimits,
  getSubscriptionContext,
  incrementUsage,
  syncUsageFromDatabase,
} from './service'
import { getCurrentUsagePeriod, normalizeUsageStats } from './usage'
import type {
  PlanLimitCheckResult,
  PlanSlug,
  SubscriptionAction,
  SubscriptionContext,
} from './types'

export { getCurrentUsagePeriod, normalizeUsageStats } from './usage'

function isUnlimited(value: number | null | undefined): boolean {
  return value === null || value === undefined
}

function exceedsCount(current: number, max: number | null | undefined, softCap?: number | null): boolean {
  const cap = softCap ?? max
  if (isUnlimited(cap)) return false
  return current >= (cap as number)
}

export async function countUserBabies(userId: string): Promise<number> {
  const { data } = await (supabaseAdmin as any)
    .from('baby_parents')
    .select('baby_id')
    .eq('parent_id', userId)
    .eq('invitation_status', 'accepted')

  const ids = new Set((data || []).map((r: { baby_id: string }) => r.baby_id).filter(Boolean))
  return ids.size
}

export async function countCaregiversOnBaby(babyId: string): Promise<number> {
  const { count } = await (supabaseAdmin as any)
    .from('baby_parents')
    .select('id', { count: 'exact', head: true })
    .eq('baby_id', babyId)
    .eq('invitation_status', 'accepted')
    .eq('is_primary', false)

  return count ?? 0
}

export async function getBabyPrimaryParentId(babyId: string): Promise<string | null> {
  const { data } = await (supabaseAdmin as any)
    .from('baby_parents')
    .select('parent_id')
    .eq('baby_id', babyId)
    .eq('is_primary', true)
    .eq('invitation_status', 'accepted')
    .maybeSingle()
  return data?.parent_id ?? null
}

export async function countUserResources(userId: string): Promise<number> {
  const { count } = await (supabaseAdmin as any)
    .from('shared_resources')
    .select('id', { count: 'exact', head: true })
    .eq('uploader_id', userId)

  return count ?? 0
}

export type CheckLimitMetadata = {
  durationSeconds?: number
  activityType?: string
  babyId?: string
  recordingSource?: 'live' | 'uploaded'
  timezone?: string | null
}

export async function checkLimit(
  userId: string,
  action: SubscriptionAction,
  metadata: CheckLimitMetadata = {},
): Promise<PlanLimitCheckResult> {
  const ctx = await getSubscriptionContext(userId, metadata.timezone)
  const { limitations: lim, slug, usage } = ctx
  const upgrade = recommendedUpgrade(slug)

  switch (action) {
    case 'create_baby': {
      const current = await countUserBabies(userId)
      const max = lim.max_babies_soft_cap ?? lim.max_babies
      if (exceedsCount(current, lim.max_babies, lim.max_babies_soft_cap)) {
        return {
          allowed: false,
          code: 'MAX_BABIES',
          error:
            slug === 'free'
              ? 'Upgrade to PLUS to add more babies.'
              : `Your plan allows up to ${max} babies. Upgrade to PRO for more.`,
          upgradeRequired: true,
          recommendedPlan: upgrade,
          current,
          max,
        }
      }
      return { allowed: true, current, max }
    }

    case 'audio_upload': {
      if (!lim.allow_audio_upload) {
        return {
          allowed: false,
          code: 'AUDIO_UPLOAD_DISABLED',
          error: 'File upload is not supported. Record using your device microphone in the app.',
          upgradeRequired: true,
          recommendedPlan: upgrade,
        }
      }
      return { allowed: true }
    }

    case 'recording_duration': {
      const duration = Number(metadata.durationSeconds ?? 0)
      const maxSec = lim.max_recording_duration_seconds
      if (duration > maxSec) {
        return {
          allowed: false,
          code: 'RECORDING_TOO_LONG',
          error: `Your plan allows recordings up to ${maxSec} seconds. Upgrade for longer clips.`,
          upgradeRequired: true,
          recommendedPlan: upgrade,
          max: maxSec,
          current: duration,
        }
      }
      return { allowed: true }
    }

    case 'create_recording': {
      if (metadata.recordingSource === 'uploaded') {
        const uploadCheck = await checkLimit(userId, 'audio_upload', metadata)
        if (!uploadCheck.allowed) return uploadCheck
      }

      const durationCheck = await checkLimit(userId, 'recording_duration', metadata)
      if (!durationCheck.allowed) return durationCheck

      const synced = await syncUsageFromDatabase(userId, metadata.timezone)
      const current = synced.recordings_count ?? 0
      const max = lim.max_recordings_per_month_soft_cap ?? lim.max_recordings_per_month

      if (exceedsCount(current, lim.max_recordings_per_month, lim.max_recordings_per_month_soft_cap)) {
        return {
          allowed: false,
          code: 'MAX_RECORDINGS',
          error: `You've used ${current}/${max} cry analyses this month. Upgrade for more.`,
          upgradeRequired: true,
          recommendedPlan: upgrade,
          current,
          max,
        }
      }
      return { allowed: true, current, max }
    }

    case 'send_family_invite': {
      if (!lim.allow_family_invites) {
        return {
          allowed: false,
          code: 'FAMILY_INVITES_DISABLED',
          error: 'Invite partners and grandparents on PLUS.',
          upgradeRequired: true,
          recommendedPlan: 'plus',
        }
      }
      if (metadata.babyId) {
        return checkLimit(userId, 'add_caregiver', metadata)
      }
      return { allowed: true }
    }

    case 'add_caregiver': {
      if (!metadata.babyId) return { allowed: true }
      if (!lim.allow_family_invites) {
        return {
          allowed: false,
          code: 'FAMILY_INVITES_DISABLED',
          error: 'Invite partners and grandparents on PLUS.',
          upgradeRequired: true,
          recommendedPlan: 'plus',
        }
      }
      const current = await countCaregiversOnBaby(metadata.babyId)
      const max = lim.max_caregivers_per_baby
      if (exceedsCount(current, max)) {
        return {
          allowed: false,
          code: 'MAX_CAREGIVERS',
          error:
            slug === 'plus'
              ? 'Your plan allows up to 2 caregivers. Upgrade to PRO for unlimited family access.'
              : 'Caregiver limit reached on your plan.',
          upgradeRequired: true,
          recommendedPlan: upgrade,
          current,
          max,
        }
      }
      return { allowed: true, current, max }
    }

    case 'create_activity': {
      const activityType = metadata.activityType || ''
      if (lim.allowed_activity_types?.length) {
        if (!lim.allowed_activity_types.includes(activityType)) {
          return {
            allowed: false,
            code: 'ACTIVITY_TYPE_BLOCKED',
            error: 'Track all activity types on PLUS.',
            upgradeRequired: true,
            recommendedPlan: 'plus',
          }
        }
      }

      if (!isUnlimited(lim.max_activities_per_month)) {
        const synced = await syncUsageFromDatabase(userId, metadata.timezone)
        const current = synced.activities_count ?? 0
        const max = lim.max_activities_per_month
        if (exceedsCount(current, max)) {
          return {
            allowed: false,
            code: 'MAX_ACTIVITIES',
            error: `You've used ${current}/${max} activity logs this month. Upgrade for unlimited tracking.`,
            upgradeRequired: true,
            recommendedPlan: upgrade,
            current,
            max,
          }
        }
      }
      return { allowed: true }
    }

    case 'create_blog_post': {
      const max = lim.max_blog_posts_per_month
      if (max === 0) {
        return {
          allowed: false,
          code: 'BLOG_DISABLED',
          error: 'Publishing blog posts is available on PLUS.',
          upgradeRequired: true,
          recommendedPlan: 'plus',
        }
      }
      if (!isUnlimited(max)) {
        const synced = await syncUsageFromDatabase(userId, metadata.timezone)
        const current = synced.blog_posts_count ?? 0
        if (exceedsCount(current, max)) {
          return {
            allowed: false,
            code: 'MAX_BLOG_POSTS',
            error: `You've reached your ${max} blog posts this month. Upgrade to PRO for unlimited publishing.`,
            upgradeRequired: true,
            recommendedPlan: upgrade,
            current,
            max,
          }
        }
      }
      return { allowed: true }
    }

    case 'create_forum_thread': {
      const synced = await syncUsageFromDatabase(userId, metadata.timezone)

      if (lim.max_forum_threads_per_week != null) {
        const weekCurrent = synced.forum_threads_week_count ?? 0
        if (weekCurrent >= lim.max_forum_threads_per_week) {
          return {
            allowed: false,
            code: 'MAX_FORUM_WEEK',
            error: 'You can post 1 forum thread per week on FREE. Upgrade for more.',
            upgradeRequired: true,
            recommendedPlan: 'plus',
            current: weekCurrent,
            max: lim.max_forum_threads_per_week,
          }
        }
      }

      const maxMonth = lim.max_forum_threads_per_month
      if (!isUnlimited(maxMonth)) {
        const current = synced.forum_threads_count ?? 0
        if (exceedsCount(current, maxMonth)) {
          return {
            allowed: false,
            code: 'MAX_FORUM_MONTH',
            error: `You've reached your ${maxMonth} forum threads this month.`,
            upgradeRequired: true,
            recommendedPlan: upgrade,
            current,
            max: maxMonth,
          }
        }
      }
      return { allowed: true }
    }

    case 'create_resource': {
      const max = lim.max_resource_uploads
      if (max === 0) {
        return {
          allowed: false,
          code: 'RESOURCES_DISABLED',
          error: 'Uploading resources is available on PLUS.',
          upgradeRequired: true,
          recommendedPlan: 'plus',
        }
      }
      if (!isUnlimited(max)) {
        const current = await countUserResources(userId)
        if (exceedsCount(current, max)) {
          return {
            allowed: false,
            code: 'MAX_RESOURCES',
            error: `Your plan allows ${max} resource uploads. Upgrade to PRO for unlimited uploads.`,
            upgradeRequired: true,
            recommendedPlan: upgrade,
            current,
            max,
          }
        }
      }
      return { allowed: true }
    }

    case 'export_insights': {
      if (!lim.allow_insights_export) {
        return {
          allowed: false,
          code: 'EXPORT_DISABLED',
          error: 'Export reports on PLUS.',
          upgradeRequired: true,
          recommendedPlan: 'plus',
        }
      }
      if (!isUnlimited(lim.max_exports_per_month)) {
        const current = usage.exports_count ?? 0
        const max = lim.max_exports_per_month
        if (exceedsCount(current, max)) {
          return {
            allowed: false,
            code: 'MAX_EXPORTS',
            error: `You've used your ${max} export this month. Upgrade to PRO for unlimited exports.`,
            upgradeRequired: true,
            recommendedPlan: upgrade,
            current,
            max,
          }
        }
      }
      return { allowed: true }
    }

    default:
      return { allowed: true }
  }
}

export function getInsightsCutoffDate(historyDays: number | null): Date | null {
  if (historyDays === null || historyDays === undefined) return null
  const d = new Date()
  d.setDate(d.getDate() - historyDays)
  d.setHours(0, 0, 0, 0)
  return d
}

export function filterRecordingsByPlanHistory<T extends { recorded_at: string }>(
  recordings: T[],
  historyDays: number | null,
): T[] {
  const cutoff = getInsightsCutoffDate(historyDays)
  if (!cutoff) return recordings
  return recordings.filter(r => new Date(r.recorded_at) >= cutoff)
}

export { getPlanLimits, getSubscriptionContext, incrementUsage, syncUsageFromDatabase }

export function usageMeter(
  ctx: SubscriptionContext,
  key: 'recordings' | 'activities' | 'exports' | 'blog' | 'forum',
): { used: number; max: number | null; label: string } | null {
  const { limitations: lim, usage } = ctx
  switch (key) {
    case 'recordings': {
      const max = lim.max_recordings_per_month_soft_cap ?? lim.max_recordings_per_month
      if (isUnlimited(max)) return null
      return {
        used: usage.recordings_count ?? 0,
        max,
        label: 'Cry analyses this month',
      }
    }
    case 'activities': {
      if (isUnlimited(lim.max_activities_per_month)) return null
      return {
        used: usage.activities_count ?? 0,
        max: lim.max_activities_per_month,
        label: 'Activity logs this month',
      }
    }
    case 'exports': {
      if (!lim.allow_insights_export || isUnlimited(lim.max_exports_per_month)) return null
      return {
        used: usage.exports_count ?? 0,
        max: lim.max_exports_per_month,
        label: 'Exports this month',
      }
    }
    default:
      return null
  }
}
