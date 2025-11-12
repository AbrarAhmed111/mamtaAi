import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const token = url.searchParams.get('token') || url.searchParams.get('token_hash')
  const type = (url.searchParams.get('type') || 'signup') as string
  const sbError = url.searchParams.get('error')
  const sbErrorCode = url.searchParams.get('error_code')

  // Surface Supabase error parameters (e.g., otp_expired)
  if (sbError) {
    const errUrl = new URL('/verify-email', request.url)
    errUrl.searchParams.set('error', 'true')
    const msg =
      sbErrorCode === 'otp_expired'
        ? 'Verification link has expired. Please request a new confirmation email.'
        : 'Invalid verification link. Please request a new confirmation email.'
    errUrl.searchParams.set('message', msg)
    return NextResponse.redirect(errUrl)
  }

  try {
    let response = NextResponse.next()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: cookiesToSet => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        const errUrl = new URL('/verify-email', request.url)
        errUrl.searchParams.set('error', 'true')
        errUrl.searchParams.set('message', error.message)
        return NextResponse.redirect(errUrl)
      }
    } else if (token) {
      const { error } = await (supabase as any).auth.verifyOtp({
        type,
        token_hash: token,
      })
      if (error) {
        const errUrl = new URL('/verify-email', request.url)
        errUrl.searchParams.set('error', 'true')
        errUrl.searchParams.set('message', error.message)
        return NextResponse.redirect(errUrl)
      }
    } else {
      const errUrl = new URL('/verify-email', request.url)
      errUrl.searchParams.set('error', 'true')
      errUrl.searchParams.set('message', 'Invalid verification link')
      return NextResponse.redirect(errUrl)
    }

    const okUrl = new URL('/signin', request.url)
    okUrl.searchParams.set('verified', '1')
    const redirectResponse = NextResponse.redirect(okUrl)
    const isLocalhost =
      okUrl.origin.startsWith('http://localhost') ||
      okUrl.origin.startsWith('http://127.0.0.1')
    response.cookies.getAll().forEach(cookie => {
      const { name, value } = cookie as any
      const options = { ...(cookie as any).options }
      if (isLocalhost) {
        options.secure = false
        options.domain = undefined
        options.sameSite = 'lax'
      }
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  } catch (e: any) {
    const errUrl = new URL('/verify-email', request.url)
    errUrl.searchParams.set('error', 'true')
    errUrl.searchParams.set('message', e?.message || 'Verification failed')
    return NextResponse.redirect(errUrl)
  }
}


