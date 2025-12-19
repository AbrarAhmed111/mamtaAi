import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const returnUrl = url.searchParams.get('returnUrl')

  if (!code) {
    const redirectUrl = new URL('/signin', request.url)
    redirectUrl.searchParams.set('error', 'true')
    redirectUrl.searchParams.set('message', 'Missing OAuth code')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('error', 'true')
      redirectUrl.searchParams.set('message', error.message)
      return NextResponse.redirect(redirectUrl)
    }

    // Ensure profile exists for OAuth users
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.id) {
        const { data: existingProfile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('id, avatar_url, full_name')
          .eq('id', user.id)
          .single()

        // Extract Google profile data
        const fullName =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          `${user.user_metadata?.given_name || ''} ${user.user_metadata?.family_name || ''}`.trim() ||
          (user.email?.split('@')[0] as string) ||
          'User'
        
        // Google provides picture in user_metadata.picture, not avatar_url
        const avatarUrl =
          (user.user_metadata?.avatar_url as string) ||
          (user.user_metadata?.picture as string) ||
          null

        if (profileFetchError) {
          // Create minimal profile for new users
          await supabase.from('profiles').insert({
            id: user.id,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: null,
            is_verified: false,
            onboarding_completed: false,
            metadata: {
              signupMethod: 'google',
            },
          } as any)
        } else if (existingProfile && !existingProfile.avatar_url && avatarUrl) {
          // Update existing profile if it doesn't have an avatar but we have one from Google
          await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', user.id)
        } else if (existingProfile && !existingProfile.full_name && fullName) {
          // Update full_name if missing
          await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', user.id)
        }
      }
    } catch {
      // Non-fatal: profile creation failure shouldn't block login
    }

    // Fetch profile to decide next step
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_verified')
          .eq('id', user.id)
          .single()

        // If role not chosen yet, take user to role selection
        if (!profile?.role) {
          return NextResponse.redirect(new URL('/auth/role', request.url))
        }
        // If expert and not verified, go to onboarding pending
        if (profile.role === 'expert' && !profile.is_verified) {
          return NextResponse.redirect(
            new URL('/onboarding?status=pending', request.url),
          )
        }
      }
    } catch {
      // ignore and continue with default redirect
    }

    // Success: redirect to returnUrl (same-origin only) or dashboard
    if (returnUrl) {
      try {
        const candidate = new URL(returnUrl, url.origin)
        if (candidate.origin === url.origin) {
          return NextResponse.redirect(candidate)
        }
      } catch {
        // ignore malformed returnUrl
      }
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (e: any) {
    const redirectUrl = new URL('/signin', request.url)
    redirectUrl.searchParams.set('error', 'true')
    redirectUrl.searchParams.set('message', e?.message || 'OAuth failed')
    return NextResponse.redirect(redirectUrl)
  }
}


