import { NextResponse, type NextRequest } from 'next/server'
import { requireActiveProfile } from '@/lib/session/server'

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireActiveProfile()
    if (!auth.ok) return auth.response

    const { user, profile } = auth

    const avatarUrl =
      profile.avatar_url ||
      (user.user_metadata?.avatar_url as string) ||
      (user.user_metadata?.picture as string) ||
      null

    const fullName =
      profile.full_name ||
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      `${user.user_metadata?.given_name || ''} ${user.user_metadata?.family_name || ''}`.trim() ||
      'User'

    if (!profile.avatar_url && avatarUrl) {
      void auth.supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      profile: {
        ...profile,
        avatar_url: avatarUrl || profile.avatar_url,
        full_name: fullName || profile.full_name,
      },
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
