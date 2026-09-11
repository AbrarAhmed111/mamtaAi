import type Stripe from 'stripe'
import { notifyAdminsOfCouponUsed } from '@/lib/notifications/admin-notifications'
import { supabaseAdmin } from '@/lib/supabase/client'
import { PLAN_DEFINITIONS } from '@/lib/subscription/plans'
import type { PlanSlug } from '@/lib/subscription/types'
import { getStripe } from './client'

export type DiscountCouponRow = {
  id: string
  code: string
  description?: string | null
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  max_discount_amount?: number | null
  valid_from?: string | null
  valid_until?: string | null
  max_uses?: number | null
  current_uses?: number | null
  max_uses_per_user?: number | null
  applicable_plans?: string[] | null
  minimum_purchase_amount?: number | null
  first_time_users_only?: boolean | null
  is_active?: boolean | null
  stripe_coupon_id?: string | null
  stripe_promotion_code_id?: string | null
}

export type CouponValidationResult =
  | { ok: true; coupon: DiscountCouponRow; promotionCodeId: string; message: string }
  | { ok: false; error: string }

function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}

function planPrice(planSlug: 'plus' | 'pro'): number {
  return PLAN_DEFINITIONS[planSlug].price_usd
}

function couponDisplay(coupon: DiscountCouponRow): string {
  if (coupon.discount_type === 'percentage') return `${Number(coupon.discount_value)}% off`
  return `$${Number(coupon.discount_value).toFixed(2)} off`
}

async function userHasPaidBefore(userId: string): Promise<boolean> {
  const { data } = await (supabaseAdmin as any)
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .not('stripe_subscription_id', 'is', null)
    .limit(1)
    .maybeSingle()
  return Boolean(data?.id)
}

function validateCouponWindow(coupon: DiscountCouponRow, planSlug: 'plus' | 'pro'): string | null {
  if (coupon.is_active === false) return 'This coupon is not active.'

  const now = Date.now()
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) {
    return 'This coupon is not active yet.'
  }
  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) {
    return 'This coupon has expired.'
  }
  if (coupon.max_uses != null && Number(coupon.current_uses ?? 0) >= Number(coupon.max_uses)) {
    return 'This coupon has reached its usage limit.'
  }
  if (Array.isArray(coupon.applicable_plans) && coupon.applicable_plans.length > 0) {
    const allowed = coupon.applicable_plans.map(p => String(p).toLowerCase())
    if (!allowed.includes(planSlug)) return `This coupon is not valid for the ${planSlug} plan.`
  }
  if (
    coupon.minimum_purchase_amount != null &&
    planPrice(planSlug) < Number(coupon.minimum_purchase_amount)
  ) {
    return 'This coupon requires a higher purchase amount.'
  }
  if (coupon.discount_type === 'percentage' && Number(coupon.discount_value) > 100) {
    return 'Percentage coupons cannot exceed 100%.'
  }
  return null
}

async function getCouponByCode(code: string): Promise<DiscountCouponRow | null> {
  const normalized = normalizeCouponCode(code)
  if (!normalized) return null
  const { data } = await (supabaseAdmin as any)
    .from('discount_coupons')
    .select('*')
    .eq('code', normalized)
    .maybeSingle()
  return (data as DiscountCouponRow | null) ?? null
}

export async function ensureStripePromotionCodeForCoupon(
  coupon: DiscountCouponRow,
): Promise<{ couponId: string; promotionCodeId: string }> {
  const stripe = getStripe()
  const code = normalizeCouponCode(coupon.code)
  if (!code) throw new Error('Coupon code is required')

  let stripeCouponId = coupon.stripe_coupon_id || null
  let stripePromotionCodeId = coupon.stripe_promotion_code_id || null

  if (!stripeCouponId) {
    const stripeCoupon = await stripe.coupons.create({
      name: code,
      duration: 'once',
      metadata: {
        mamta_coupon_id: coupon.id,
        mamta_coupon_code: code,
      },
      ...(coupon.discount_type === 'percentage'
        ? { percent_off: Number(coupon.discount_value) }
        : {
            amount_off: Math.round(Number(coupon.discount_value) * 100),
            currency: 'usd',
          }),
    })
    stripeCouponId = stripeCoupon.id
  }

  if (!stripePromotionCodeId) {
    const promotion = await stripe.promotionCodes.create({
      promotion: {
        type: 'coupon',
        coupon: stripeCouponId,
      },
      code,
      active: coupon.is_active !== false,
      max_redemptions: coupon.max_uses ?? undefined,
      expires_at: coupon.valid_until
        ? Math.floor(new Date(coupon.valid_until).getTime() / 1000)
        : undefined,
      metadata: {
        mamta_coupon_id: coupon.id,
        mamta_coupon_code: code,
      },
    })
    stripePromotionCodeId = promotion.id
  }

  if (
    stripeCouponId !== coupon.stripe_coupon_id ||
    stripePromotionCodeId !== coupon.stripe_promotion_code_id
  ) {
    await (supabaseAdmin as any)
      .from('discount_coupons')
      .update({
        stripe_coupon_id: stripeCouponId,
        stripe_promotion_code_id: stripePromotionCodeId,
      })
      .eq('id', coupon.id)
  }

  return { couponId: stripeCouponId, promotionCodeId: stripePromotionCodeId }
}

export async function setStripePromotionCodeActive(
  coupon: DiscountCouponRow,
  active: boolean,
): Promise<void> {
  const stripePromotionCodeId = coupon.stripe_promotion_code_id
  if (!stripePromotionCodeId) return
  await getStripe().promotionCodes.update(stripePromotionCodeId, { active })
}

export async function validateCouponForCheckout(params: {
  code: string
  planSlug: 'plus' | 'pro'
  userId: string
}): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(params.code)
  if (!coupon) return { ok: false, error: 'Coupon not found.' }

  const invalidReason = validateCouponWindow(coupon, params.planSlug)
  if (invalidReason) return { ok: false, error: invalidReason }

  if (coupon.first_time_users_only && (await userHasPaidBefore(params.userId))) {
    return { ok: false, error: 'This coupon is only for first-time paid subscribers.' }
  }

  const { promotionCodeId } = await ensureStripePromotionCodeForCoupon(coupon)
  return {
    ok: true,
    coupon,
    promotionCodeId,
    message: `${coupon.code} applied: ${couponDisplay(coupon)}.`,
  }
}

type CouponRedemptionSource = {
  stripeSubscriptionId?: string | null
  stripeCheckoutSessionId?: string | null
  stripeInvoiceId?: string | null
}

async function incrementCouponUsage(coupon: { id: string; current_uses?: number | null }): Promise<void> {
  await (supabaseAdmin as any)
    .from('discount_coupons')
    .update({
      current_uses: Number(coupon.current_uses ?? 0) + 1,
    })
    .eq('id', coupon.id)
}

function couponRedemptionKey(couponId: string, source: CouponRedemptionSource): string {
  if (source.stripeSubscriptionId) return `subscription:${source.stripeSubscriptionId}:coupon:${couponId}`
  if (source.stripeCheckoutSessionId) return `checkout:${source.stripeCheckoutSessionId}:coupon:${couponId}`
  if (source.stripeInvoiceId) return `invoice:${source.stripeInvoiceId}:coupon:${couponId}`
  return `manual:${Date.now()}:coupon:${couponId}`
}

function promotionCodeFromDiscount(discount: unknown): string | null {
  if (!discount || typeof discount !== 'object') return null
  const promo = (discount as { promotion_code?: unknown }).promotion_code
  if (typeof promo === 'object' && promo && 'code' in promo && promo.code) {
    return String((promo as { code: string }).code)
  }
  return null
}

async function recordCouponRedemptionOnce(params: {
  code: string
  userId: string
  planSlug?: string | null
  source: CouponRedemptionSource
}): Promise<void> {
  const code = normalizeCouponCode(params.code)
  if (!code) return

  const { data: coupon } = await (supabaseAdmin as any)
    .from('discount_coupons')
    .select('id, code, current_uses')
    .eq('code', code)
    .maybeSingle()

  if (!coupon?.id) return

  const redemptionKey = couponRedemptionKey(String(coupon.id), params.source)
  const { error } = await (supabaseAdmin as any).from('coupon_redemptions').insert({
    coupon_id: coupon.id,
    user_id: params.userId,
    code,
    plan_slug: params.planSlug ?? null,
    stripe_subscription_id: params.source.stripeSubscriptionId ?? null,
    stripe_checkout_session_id: params.source.stripeCheckoutSessionId ?? null,
    stripe_invoice_id: params.source.stripeInvoiceId ?? null,
    redemption_key: redemptionKey,
  })

  if (error) {
    if (error.code === '23505') return
    throw error
  }

  await incrementCouponUsage(coupon)
  notifyAdminsOfCouponUsed({ code, userId: params.userId, planSlug: params.planSlug ?? null })
}

async function recordCodes(
  codes: string[],
  userId: string,
  planSlug: string | null | undefined,
  source: CouponRedemptionSource,
): Promise<void> {
  const unique = [...new Set(codes.map(c => c.trim().toUpperCase()).filter(Boolean))]
  for (const code of unique) {
    await recordCouponRedemptionOnce({ code, userId, planSlug, source })
  }
}

export async function recordCouponRedemptionsFromCheckoutSession(
  session: Stripe.Checkout.Session,
  userId: string,
  planSlug?: string | null,
): Promise<void> {
  const stripe = getStripe()
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['discounts', 'discounts.promotion_code'],
  })

  const codes = (full.discounts ?? [])
    .map(d => promotionCodeFromDiscount(d))
      .filter((c): c is string => Boolean(c))

  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

  await recordCodes(codes, userId, planSlug, {
    stripeSubscriptionId,
    stripeCheckoutSessionId: session.id,
  })
}

export async function recordCouponRedemptionsFromInvoice(
  invoice: Stripe.Invoice,
  userId: string,
  stripeSubscriptionId?: string | null,
): Promise<void> {
  if (!invoice.id || !invoice.discounts?.length) return
  // Initial checkout is handled by checkout.session.completed to avoid double-counting.
  if (invoice.billing_reason === 'subscription_create') return

  const stripe = getStripe()
  const full = await stripe.invoices.retrieve(invoice.id, {
    expand: ['discounts', 'discounts.promotion_code'],
  })

  const codes = (full.discounts ?? [])
    .map(d => promotionCodeFromDiscount(d))
    .filter((c): c is string => Boolean(c))

  if (!codes.length) return
  await recordCodes(codes, userId, null, {
    stripeSubscriptionId,
    stripeInvoiceId: invoice.id,
  })
}
