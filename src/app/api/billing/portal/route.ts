import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/stripe/checkout'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await createBillingPortalSession(user.id)
    return NextResponse.json({ url })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Portal session failed'
    const status = message.includes('No billing account') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
