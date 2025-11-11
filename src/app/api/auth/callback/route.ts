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
          .select('id')
          .eq('id', user.id)
          .single()

        if (profileFetchError) {
          const fullName =
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            (user.email as string) ||
            'User'
          const avatarUrl =
            (user.user_metadata?.avatar_url as string) || null

          // Create minimal profile
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


