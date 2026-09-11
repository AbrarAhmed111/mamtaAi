import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const provider = (url.searchParams.get('provider') || 'google') as 'google' | 'apple'
    const returnUrl = url.searchParams.get('returnUrl') || ''

    const supabase = await createServerClient()

    // Keep redirect_to EXACTLY equal to the allow-listed callback URL.
    // Query params (e.g. returnUrl) would break Supabase's exact match and make it
    // fall back to the project Site URL, so we carry returnUrl in a cookie instead.
    const redirectTarget = new URL('/api/auth/callback', request.url)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTarget.toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        // Request profile and email scopes to get user info
        scopes: provider === 'google' ? 'email profile' : undefined,
      },
    })

    if (error || !data?.url) {
      const errUrl = new URL('/signin', request.url)
      errUrl.searchParams.set('error', 'true')
      errUrl.searchParams.set('message', error?.message || 'OAuth init failed')
      return NextResponse.redirect(errUrl)
    }

    const response = NextResponse.redirect(data.url)
    if (returnUrl) {
      response.cookies.set('oauth_return_url', returnUrl, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 10,
      })
    } else {
      response.cookies.delete('oauth_return_url')
    }
    return response
  } catch (e: any) {
    const errUrl = new URL('/signin', request.url)
    errUrl.searchParams.set('error', 'true')
    errUrl.searchParams.set('message', e?.message || 'OAuth init failed')
    return NextResponse.redirect(errUrl)
  }
}


