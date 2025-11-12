import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const token = url.searchParams.get('token') || url.searchParams.get('token_hash')
  const type = (url.searchParams.get('type') || 'signup') as string
  const sbError = url.searchParams.get('error')
  const sbErrorCode = url.searchParams.get('error_code')

  // If Supabase passed error params (e.g., otp_expired), just send user to signin (no error presentation page)
  if (sbError) {
    const errSignin = new URL('/signin', request.url)
    return NextResponse.redirect(errSignin)
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

    // Prefer token-based verification for email confirmations.
    // Only use code exchange for true PKCE/code flows.
    if (type === 'signup' || type === 'email_change') {
      if (!token) {
        const errUrl = new URL('/verify-email', request.url)
        errUrl.searchParams.set('error', 'true')
        errUrl.searchParams.set('message', 'Invalid verification link')
        return NextResponse.redirect(errUrl)
      }
      const { error } = await (supabase as any).auth.verifyOtp({
        type,
        token_hash: token,
      })
      if (error) {
        const errSignin = new URL('/signin', request.url)
        return NextResponse.redirect(errSignin)
      }
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        const errSignin = new URL('/signin', request.url)
        return NextResponse.redirect(errSignin)
      }
    } else if (token) {
      const { error } = await (supabase as any).auth.verifyOtp({
        type,
        token_hash: token,
      })
      if (error) {
        const errSignin = new URL('/signin', request.url)
        return NextResponse.redirect(errSignin)
      }
    } else {
      const errSignin = new URL('/signin', request.url)
      return NextResponse.redirect(errSignin)
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
    const errSignin = new URL('/signin', request.url)
    return NextResponse.redirect(errSignin)
  }
}


