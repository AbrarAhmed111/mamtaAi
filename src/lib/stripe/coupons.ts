import type Stripe from 'stripe'
import { notifyAdminsOfCouponUsed } from '@/lib/notifications/admin-notifications'
import { supabaseAdmin } from '@/lib/supabase/client'
import { getStripe } from './client'

async function incrementCouponUsage(code: string): Promise<void> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return

  const { data: coupon } = await (supabaseAdmin as any)
    .from('discount_coupons')
    .select('id, current_uses')
    .eq('code', normalized)
    .maybeSingle()

  if (!coupon?.id) return

  await (supabaseAdmin as any)
    .from('discount_coupons')
    .update({
      current_uses: Number(coupon.current_uses ?? 0) + 1,
    })
    .eq('id', coupon.id)
}

function promotionCodeFromDiscount(discount: unknown): string | null {
  if (!discount || typeof discount !== 'object') return null
  const promo = (discount as { promotion_code?: unknown }).promotion_code
  if (typeof promo === 'object' && promo && 'code' in promo && promo.code) {
    return String((promo as { code: string }).code)
  }
  return null
}

async function recordCodes(codes: string[], userId: string, planSlug?: string | null): Promise<void> {
  const unique = [...new Set(codes.map(c => c.trim().toUpperCase()).filter(Boolean))]
  for (const code of unique) {
    await incrementCouponUsage(code)
    notifyAdminsOfCouponUsed({ code, userId, planSlug: planSlug ?? null })
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

  await recordCodes(codes, userId, planSlug)
}

export async function recordCouponRedemptionsFromInvoice(
  invoice: Stripe.Invoice,
  userId: string,
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
  await recordCodes(codes, userId, null)
}
