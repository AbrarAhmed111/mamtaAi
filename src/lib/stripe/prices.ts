import { supabaseAdmin } from '@/lib/supabase/client'
import type { PlanSlug } from '@/lib/subscription/types'

const PAID_SLUGS = new Set<PlanSlug>(['plus', 'pro'])

export function isPaidPlanSlug(slug: string): slug is 'plus' | 'pro' {
  return PAID_SLUGS.has(slug as PlanSlug)
}

function envPriceForSlug(slug: 'plus' | 'pro'): string | undefined {
  if (slug === 'plus') {
    return (
      process.env.STRIPE_PRICE_PLUS_MONTHLY ||
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY
    )
  }
  return (
    process.env.STRIPE_PRICE_PRO_MONTHLY ||
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
  )
}

export async function getStripePriceIdForPlan(slug: 'plus' | 'pro'): Promise<string> {
  const { data } = await (supabaseAdmin as any)
    .from('subscription_plans')
    .select('stripe_price_id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  const fromDb = data?.stripe_price_id as string | undefined
  if (fromDb) return fromDb

  const fromEnv = envPriceForSlug(slug)
  if (fromEnv) return fromEnv

  throw new Error(`No Stripe price configured for plan "${slug}"`)
}

export async function getPlanSlugByStripePriceId(priceId: string): Promise<PlanSlug | null> {
  const { data } = await (supabaseAdmin as any)
    .from('subscription_plans')
    .select('slug')
    .eq('stripe_price_id', priceId)
    .maybeSingle()

  if (data?.slug === 'plus' || data?.slug === 'pro' || data?.slug === 'free') {
    return data.slug
  }

  if (priceId === process.env.STRIPE_PRICE_PLUS_MONTHLY) return 'plus'
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return 'pro'

  return null
}

export async function getPlanIdBySlug(slug: PlanSlug): Promise<string | null> {
  const { data } = await (supabaseAdmin as any)
    .from('subscription_plans')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return data?.id ?? null
}
