import { NextResponse } from 'next/server'
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe/client'
import { handleStripeWebhookEvent } from '@/lib/stripe/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event
  try {
    const body = await request.text()
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret())
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Invalid webhook signature'
    console.error('[stripe webhook]', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    await handleStripeWebhookEvent(event)
    return NextResponse.json({ received: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Webhook handler failed'
    console.error('[stripe webhook]', event.type, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
