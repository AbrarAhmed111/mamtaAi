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


