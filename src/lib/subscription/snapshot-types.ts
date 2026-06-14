import type { PlanDefinition, PlanLimitations, PlanSlug, UsageStats } from './types'

export type SubscriptionMeterSnapshot = {
  used: number
  max: number | null
  label: string
} | null

export type SubscriptionBillingSnapshot = {
  canManageBilling: boolean
  hasStripeSubscription: boolean
  cancelAtPeriodEnd: boolean
  subscriptionStatus: string | null
  currentPeriodEnd: string | null
  pendingPlanChange: {
    plan_slug: string
    effective_at: string
  } | null
}

export type SubscriptionSnapshot = {
  plan: {
    slug: PlanSlug
    name: string
    status: string
    limitations: PlanLimitations
    showUpsellBanners: boolean
  }
  billing: SubscriptionBillingSnapshot
  usage: UsageStats
  meters: {
    recordings: SubscriptionMeterSnapshot
    activities: SubscriptionMeterSnapshot
    exports: SubscriptionMeterSnapshot
  }
  plans: Array<
    Pick<
      PlanDefinition,
      | 'slug'
      | 'name'
      | 'description'
      | 'price_usd'
      | 'billing_cycle'
      | 'is_popular'
      | 'features'
      | 'limitations'
    >
  >
}
