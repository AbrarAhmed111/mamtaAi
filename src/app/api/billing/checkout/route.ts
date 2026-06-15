import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createCheckoutOrUpgrade } from '@/lib/stripe/checkout'
import { isPaidPlanSlug } from '@/lib/stripe/prices'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const planSlug = String(body?.planSlug || body?.plan_slug || '').toLowerCase()
    const couponCode = String(body?.couponCode || body?.coupon_code || '').trim()

    if (!isPaidPlanSlug(planSlug)) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose plus or pro.' },
        { status: 400 },
      )
    }

    const { url, outcome } = await createCheckoutOrUpgrade({
      userId: user.id,
      email: user.email,
      planSlug,
      couponCode: couponCode || null,
    })

    return NextResponse.json({ url, outcome })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Checkout failed'
    const status = message.includes('already on this plan') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
