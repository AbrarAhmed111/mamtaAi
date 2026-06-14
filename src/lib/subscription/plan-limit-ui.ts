import type { PlanSlug } from './types'

export function getPlanLimitFeatureLabel(code?: string): string {
  switch (code) {
    case 'MAX_BABIES':
      return 'Baby profiles'
    case 'MAX_RECORDINGS':
    case 'RECORDING_TOO_LONG':
    case 'AUDIO_UPLOAD_DISABLED':
      return 'Cry analysis'
    case 'FAMILY_INVITES_DISABLED':
    case 'MAX_CAREGIVERS':
      return 'Family invites'
    case 'ACTIVITY_TYPE_BLOCKED':
    case 'MAX_ACTIVITIES':
      return 'Activity tracking'
    case 'BLOG_DISABLED':
    case 'MAX_BLOG_POSTS':
      return 'Blog publishing'
    case 'MAX_FORUM_WEEK':
    case 'MAX_FORUM_MONTH':
      return 'Forum discussions'
    case 'RESOURCES_DISABLED':
    case 'MAX_RESOURCES':
      return 'Resource sharing'
    case 'EXPORT_DISABLED':
    case 'MAX_EXPORTS':
      return 'Insights export'
    default:
      return 'This feature'
  }
}

export function getRecommendedPlanLabel(slug?: PlanSlug): string {
  if (slug === 'pro') return 'Pro'
  if (slug === 'plus') return 'Plus'
  return 'a paid plan'
}
