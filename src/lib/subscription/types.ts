export type PlanSlug = 'free' | 'plus' | 'pro'

export type SubscriptionAction =
  | 'create_baby'
  | 'create_recording'
  | 'recording_duration'
  | 'audio_upload'
  | 'send_family_invite'
  | 'add_caregiver'
  | 'create_activity'
  | 'create_blog_post'
  | 'create_forum_thread'
  | 'create_resource'
  | 'export_insights'

export type UsageStats = {
  period: string
  recordings_count?: number
  activities_count?: number
  forum_threads_count?: number
  forum_threads_week_count?: number
  blog_posts_count?: number
  exports_count?: number
}

export type UsageCounterKey = keyof Omit<UsageStats, 'period'>

export type PlanLimitations = {
  max_babies: number | null
  max_babies_soft_cap?: number | null
  max_recordings_per_month: number | null
  max_recordings_per_month_soft_cap?: number | null
  max_recording_duration_seconds: number
  allow_audio_upload: boolean
  allow_family_invites: boolean
  max_caregivers_per_baby: number | null
  max_activities_per_month: number | null
  allowed_activity_types: string[] | null
  insights_history_days: number | null
  insights_full_charts: boolean
  insights_baby_comparison?: boolean
  allow_insights_export: boolean
  max_exports_per_month: number | null
  max_blog_posts_per_month: number | null
  max_forum_threads_per_week: number | null
  max_forum_threads_per_month: number | null
  max_resource_uploads: number | null
  recording_history_days: number | null
  show_upsell_banners: boolean
  priority_support?: boolean
}

export type PlanDefinition = {
  slug: PlanSlug
  name: string
  description: string
  price_usd: number
  billing_cycle: 'monthly' | 'yearly' | 'lifetime'
  is_popular: boolean
  display_order: number
  features: string[]
  limitations: PlanLimitations
}

export type UserSubscriptionRow = {
  id: string
  user_id: string
  plan_id: string
  status: string
  usage_stats: UsageStats | null
  current_period_start: string
  current_period_end: string
  plan?: {
    slug: string
    name: string
    limitations: PlanLimitations
    features?: string[]
  }
}

export type SubscriptionContext = {
  slug: PlanSlug
  planName: string
  limitations: PlanLimitations
  usage: UsageStats
  subscriptionId: string | null
  status: string
}

export type PlanLimitCheckResult = {
  allowed: boolean
  error?: string
  code?: string
  upgradeRequired?: boolean
  recommendedPlan?: PlanSlug
  current?: number
  max?: number | null
}

export type PlanLimitErrorBody = {
  error: 'PLAN_LIMIT_REACHED'
  message: string
  upgradeRequired: boolean
  recommendedPlan: PlanSlug
  code?: string
  current?: number
  max?: number | null
}
