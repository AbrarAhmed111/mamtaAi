import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { createBillingPortalSession } from '@/lib/stripe/checkout'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  try {
    const { url } = await createBillingPortalSession(auth.auth.user.id)
    return NextResponse.json({ url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Portal session failed'
    return NextResponse.json({ error: message }, { status: message.includes('No billing account') ? 400 : 500 })
  }
}

