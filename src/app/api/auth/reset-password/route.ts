import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const sbError = searchParams.get('error')
  const sbErrorCode = searchParams.get('error_code')

  // Handle Supabase-provided error states (e.g., otp_expired)
  if (sbError) {
    const redirectUrl = new URL('/reset-password', request.url)
    redirectUrl.searchParams.set('error', 'true')
    const msg =
      sbErrorCode === 'otp_expired'
        ? 'Password reset link has expired. Please request a new one.'
        : 'Invalid reset link. Please request a new password reset.'
    redirectUrl.searchParams.set('message', msg)
    return NextResponse.redirect(redirectUrl)
  }

  // Accept links that only include the authorization code
  if (code) {
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

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data?.session || !data?.user) {
      const redirectUrl = new URL('/reset-password', request.url)
      redirectUrl.searchParams.set('error', 'true')
      const msg =
        /expired|otp_expired|access_denied/i.test(exchangeError?.message || '')
          ? 'Reset link expired or already used. Please request a new password reset.'
          : 'Invalid or expired reset link. Please request a new password reset.'
      redirectUrl.searchParams.set('message', msg)
      return NextResponse.redirect(redirectUrl)
    }

    const successUrl = new URL('/reset-password', request.url)
    successUrl.searchParams.set('validated', 'true')
    const redirectResponse = NextResponse.redirect(successUrl)
    const isLocalhost =
      successUrl.origin.startsWith('http://localhost') ||
      successUrl.origin.startsWith('http://127.0.0.1')
    response.cookies.getAll().forEach(cookie => {
      // Ensure localhost can receive cookies by disabling "secure" and domain pinning
      const opts = {
        ...cookie,
        // name/value are spread too; NextResponse.cookies.set(name, value, options) expects options only
      } as any
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
  }

  const redirectUrl = new URL('/reset-password', request.url)
  redirectUrl.searchParams.set('error', 'true')
  redirectUrl.searchParams.set(
    'message',
    'Invalid reset link. Please request a new password reset.',
  )
  return NextResponse.redirect(redirectUrl)
}


