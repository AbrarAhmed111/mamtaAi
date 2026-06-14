import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi, getAdminDb, writeAuditLog } from '@/lib/admin'
import { getPlanIdBySlug, getStripePriceIdForPlan } from '@/lib/stripe/prices'
import { syncStripeSubscriptionById, downgradeUserToFree } from '@/lib/stripe/sync'
import { getStripe } from '@/lib/stripe/client'
import type { PlanSlug } from '@/lib/subscription/types'

export const dynamic = 'force-dynamic'

type RouteCtx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const planSlug = body.planSlug as PlanSlug | undefined
  const status = body.status as string | undefined

  if (!planSlug && !status) {
    return NextResponse.json({ error: 'planSlug or status required' }, { status: 400 })
  }

  const db = getAdminDb()
  const { data: subRow, error: fetchError } = await (db as any)
    .from('user_subscriptions')
    .select('id, user_id, plan_id, status, stripe_subscription_id, plan:subscription_plans!user_subscriptions_plan_id_fkey(slug)')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!subRow) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

  const oldValues = {
    planSlug: subRow.plan?.slug,
    status: subRow.status,
  }

  if (planSlug) {
    if (!['free', 'plus', 'pro'].includes(planSlug)) {
      return NextResponse.json({ error: 'Invalid planSlug' }, { status: 400 })
    }

    const planId = await getPlanIdBySlug(planSlug)
    if (!planId) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    if (planSlug === 'free') {
      if (subRow.stripe_subscription_id) {
        try {
          const stripe = getStripe()
          await stripe.subscriptions.cancel(subRow.stripe_subscription_id)
        } catch (e) {
          console.error('[admin] stripe cancel failed', e)
        }
      }
      await downgradeUserToFree(subRow.user_id)
    } else if (subRow.stripe_subscription_id) {
      const priceId = await getStripePriceIdForPlan(planSlug as 'plus' | 'pro')
      const stripe = getStripe()
      const subscription = await stripe.subscriptions.retrieve(subRow.stripe_subscription_id)
      const itemId = subscription.items.data[0]?.id
      if (!itemId) {
        return NextResponse.json({ error: 'Stripe subscription has no items' }, { status: 400 })
      }
      await stripe.subscriptions.update(subRow.stripe_subscription_id, {
        items: [{ id: itemId, price: priceId }],
        proration_behavior: 'create_prorations',
        metadata: { user_id: subRow.user_id, plan_slug: planSlug },
      })
      await syncStripeSubscriptionById(subRow.stripe_subscription_id, subRow.user_id)
    } else {
      await (db as any)
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    }
  }

  if (status && ['trial', 'active', 'paused', 'cancelled', 'payment_failed'].includes(status)) {
    await (db as any)
      .from('user_subscriptions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  const { data: refreshed } = await (db as any)
    .from('user_subscriptions')
    .select('id, status, plan:subscription_plans!user_subscriptions_plan_id_fkey(slug)')
    .eq('id', id)
    .maybeSingle()

  await writeAuditLog({
    adminId: auth.admin.id,
    action: 'admin_subscription_override',
    entityType: 'user_subscription',
    entityId: id,
    oldValues,
    newValues: {
      planSlug: refreshed?.plan?.slug,
      status: refreshed?.status,
      requestedPlanSlug: planSlug,
      requestedStatus: status,
    },
    metadata: { userId: subRow.user_id },
  })

  return NextResponse.json({ ok: true, subscription: refreshed })
}
