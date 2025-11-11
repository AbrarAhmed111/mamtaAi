import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const provider = (url.searchParams.get('provider') || 'google') as 'google' | 'apple'
    const returnUrl = url.searchParams.get('returnUrl') || ''

    const supabase = await createServerClient()

    const redirectTarget = new URL('/api/auth/callback', request.url)
    if (returnUrl) {
      redirectTarget.searchParams.set('returnUrl', returnUrl)
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTarget.toString(),
      },
    })

    if (error || !data?.url) {
      const errUrl = new URL('/signin', request.url)
      errUrl.searchParams.set('error', 'true')
      errUrl.searchParams.set('message', error?.message || 'OAuth init failed')
      return NextResponse.redirect(errUrl)
    }

    return NextResponse.redirect(data.url)
  } catch (e: any) {
    const errUrl = new URL('/signin', request.url)
    errUrl.searchParams.set('error', 'true')
    errUrl.searchParams.set('message', e?.message || 'OAuth init failed')
    return NextResponse.redirect(errUrl)
  }
}


