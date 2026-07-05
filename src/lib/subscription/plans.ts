import type { PlanDefinition, PlanLimitations, PlanSlug } from './types'

export const PLAN_SLUGS: PlanSlug[] = ['free', 'plus', 'pro']

const FREE_LIMITS: PlanLimitations = {
  max_babies: 1,
  max_recordings_per_month: 7,
  max_recording_duration_seconds: 30,
  allow_audio_upload: true,
  allow_family_invites: false,
  max_caregivers_per_baby: 0,
  max_activities_per_month: 20,
  allowed_activity_types: ['feeding', 'sleep', 'diaper_change'],
  insights_history_days: 7,
  insights_full_charts: false,
  allow_insights_export: false,
  max_exports_per_month: 0,
  max_blog_posts_per_month: 0,
  max_forum_threads_per_week: 1,
  max_forum_threads_per_month: 4,
  max_resource_uploads: 0,
  recording_history_days: 90,
  show_upsell_banners: true,
}

const PLUS_LIMITS: PlanLimitations = {
  max_babies: 3,
  max_recordings_per_month: 60,
  max_recording_duration_seconds: 120,
  allow_audio_upload: true,
  allow_family_invites: true,
  max_caregivers_per_baby: 2,
  max_activities_per_month: null,
  allowed_activity_types: null,
  insights_history_days: 90,
  insights_full_charts: true,
  allow_insights_export: true,
  max_exports_per_month: 1,
  max_blog_posts_per_month: 2,
  max_forum_threads_per_week: null,
  max_forum_threads_per_month: 10,
  max_resource_uploads: 3,
  recording_history_days: 365,
  show_upsell_banners: false,
}

const PRO_LIMITS: PlanLimitations = {
  max_babies: null,
  max_babies_soft_cap: 10,
  max_recordings_per_month: null,
  max_recordings_per_month_soft_cap: 500,
  max_recording_duration_seconds: 300,
  allow_audio_upload: true,
  allow_family_invites: true,
  max_caregivers_per_baby: null,
  max_activities_per_month: null,
  allowed_activity_types: null,
  insights_history_days: null,
  insights_full_charts: true,
  insights_baby_comparison: true,
  allow_insights_export: true,
  max_exports_per_month: null,
  max_blog_posts_per_month: null,
  max_forum_threads_per_week: null,
  max_forum_threads_per_month: null,
  max_resource_uploads: null,
  recording_history_days: null,
  show_upsell_banners: false,
}

export const PLAN_DEFINITIONS: Record<PlanSlug, PlanDefinition> = {
  free: {
    slug: 'free',
    name: 'Free',
    description: 'Understand your baby’s cries with one profile and light monthly usage.',
    price_usd: 0,
    billing_cycle: 'monthly',
    is_popular: false,
    display_order: 1,
    features: [
      '1 baby profile',
      '7 cry analyses per month',
      '8-second recordings',
      'Upload audio',
      '7-day insights',
      'Read community content',
    ],
    limitations: FREE_LIMITS,
  },
  plus: {
    slug: 'plus',
    name: 'Plus',
    description: 'Daily parenting with family help and deeper insights.',
    price_usd: 9.99,
    billing_cycle: 'monthly',
    is_popular: true,
    display_order: 2,
    features: [
      'Up to 3 babies',
      '60 cry analyses per month',
      '8-second recordings',
      'Upload audio',
      'Invite 2 caregivers',
      '90-day insights & 1 export/month',
      'Community publishing (limited)',
    ],
    limitations: PLUS_LIMITS,
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    description: 'Unlimited access for growing families and power caregivers.',
    price_usd: 19.99,
    billing_cycle: 'monthly',
    is_popular: false,
    display_order: 3,
    features: [
      'Unlimited babies & caregivers',
      'Unlimited cry analyses (fair use)',
      '8-second recordings',
      'Upload audio',
      'All-time insights & exports',
      'Unlimited community publishing',
    ],
    limitations: PRO_LIMITS,
  },
}

export function getPlanDefinition(slug: string): PlanDefinition {
  const key = slug as PlanSlug
  return PLAN_DEFINITIONS[key] ?? PLAN_DEFINITIONS.free
}

export function mergeLimitations(
  dbLimitations: Partial<PlanLimitations> | null | undefined,
  slug: PlanSlug,
): PlanLimitations {
  const fallback = PLAN_DEFINITIONS[slug].limitations
  if (!dbLimitations || typeof dbLimitations !== 'object') return fallback
  return { ...fallback, ...dbLimitations } as PlanLimitations
}

export function recommendedUpgrade(from: PlanSlug): PlanSlug {
  if (from === 'free') return 'plus'
  return 'pro'
}

export function planRank(slug: PlanSlug): number {
  return PLAN_DEFINITIONS[slug]?.display_order ?? 0
}

export function isDowngrade(from: PlanSlug, to: PlanSlug): boolean {
  return planRank(to) < planRank(from)
}
