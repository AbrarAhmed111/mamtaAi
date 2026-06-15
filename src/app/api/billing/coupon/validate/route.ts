import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isPaidPlanSlug } from '@/lib/stripe/prices'
import { validateCouponForCheckout } from '@/lib/stripe/coupons'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const planSlug = String(body?.planSlug || body?.plan_slug || '').toLowerCase()
    const code = String(body?.code || body?.couponCode || body?.coupon_code || '').trim()

    if (!isPaidPlanSlug(planSlug)) {
      return NextResponse.json({ error: 'Choose Plus or Pro before applying a coupon.' }, { status: 400 })
    }
    if (!code) {
      return NextResponse.json({ error: 'Enter a coupon code.' }, { status: 400 })
    }

    const result = await validateCouponForCheckout({ code, planSlug, userId: user.id })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      code: result.coupon.code,
      discountType: result.coupon.discount_type,
      discountValue: result.coupon.discount_value,
      message: result.message,
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not validate coupon' },
      { status: 500 },
    )
  }
}
