import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { getSubscriptionContext } from '@/lib/subscription/service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const subscription = await getSubscriptionContext(auth.auth.user.id, auth.auth.profile?.timezone)
  return NextResponse.json({
    subscription: {
      slug: subscription.slug,
      status: subscription.status,
      planName: subscription.planName,
      usage: subscription.usage,
      limitations: subscription.limitations,
    },
  })
}

