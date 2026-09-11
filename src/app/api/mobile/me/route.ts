import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'
import { getSubscriptionContext } from '@/lib/subscription/service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const userId = auth.auth.user.id
  const { data: membership } = await (supabaseAdmin as any)
    .from('baby_parents')
    .select('baby_id')
    .eq('parent_id', userId)

  const babyIds = [...new Set((membership || []).map((row: any) => row.baby_id).filter(Boolean))]
  const { data: babies } = babyIds.length
    ? await (supabaseAdmin as any)
        .from('babies')
        .select('id, name, birth_date, gender, avatar_url')
        .in('id', babyIds)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
    : { data: [] }

  const subscription = await getSubscriptionContext(userId, auth.auth.profile?.timezone)

  return NextResponse.json({
    user: {
      id: userId,
      email: auth.auth.user.email,
      fullName: auth.auth.profile?.full_name ?? null,
      role: auth.auth.profile?.role ?? 'parent',
    },
    babies: (babies || []).map((baby: any) => ({
      id: baby.id,
      name: baby.name,
      birthDate: baby.birth_date,
      gender: baby.gender,
      avatarUrl: baby.avatar_url,
    })),
    subscription: {
      slug: subscription.slug,
      status: subscription.status,
      planName: subscription.planName,
      usage: subscription.usage,
      limitations: subscription.limitations,
    },
  })
}

