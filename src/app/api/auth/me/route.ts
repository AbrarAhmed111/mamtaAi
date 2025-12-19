import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No user' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'No profile' }, { status: 404 })
    }

    // Fallback to auth user metadata if profile doesn't have avatar_url (for Google OAuth users)
    const avatarUrl = profile.avatar_url || 
      (user.user_metadata?.avatar_url as string) || 
      (user.user_metadata?.picture as string) || 
      null

    const fullName = profile.full_name || 
      (user.user_metadata?.full_name as string) || 
      (user.user_metadata?.name as string) || 
      `${user.user_metadata?.given_name || ''} ${user.user_metadata?.family_name || ''}`.trim() ||
      profile.full_name ||
      'User'

    // Update profile if we have better data from auth metadata
    if (!profile.avatar_url && avatarUrl) {
      // Update profile asynchronously (don't block the response)
      void supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)
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
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}


