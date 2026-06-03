import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { handleCheckoutSessionCompleted } from '@/lib/stripe/sync'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const checkoutSessionId = String(
      body?.checkoutSessionId || body?.checkout_session || body?.session_id || '',
    ).trim()

    if (!checkoutSessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid checkout session id' }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId)

    if (session.metadata?.user_id && session.metadata.user_id !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 })
    }

    if (session.status !== 'complete') {
      return NextResponse.json(
        { error: 'Checkout is not complete yet. Please wait a moment and refresh.' },
        { status: 409 },
      )
    }

    if (session.mode === 'subscription') {
      await handleCheckoutSessionCompleted(session)
    }

    return NextResponse.json({
      ok: true,
      planSlug: session.metadata?.plan_slug ?? null,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to confirm checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
