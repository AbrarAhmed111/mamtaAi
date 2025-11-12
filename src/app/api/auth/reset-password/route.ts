import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  // Accept links that only include the authorization code
  if (!code) {
    const redirectUrl = new URL('/reset-password', request.url)
    redirectUrl.searchParams.set('error', 'true')
    redirectUrl.searchParams.set('message', 'Invalid or expired reset link. Please request a new one.')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const redirectUrl = new URL('/reset-password', request.url)
      redirectUrl.searchParams.set('error', 'true')
      // Improve messaging for common cases like otp_expired/access_denied
      const msg =
        /expired|otp_expired|access_denied/i.test(error.message)
          ? 'Reset link expired or already used. Please request a new password reset.'
          : error.message
      redirectUrl.searchParams.set('message', msg)
      return NextResponse.redirect(redirectUrl)
    }

    const successUrl = new URL('/reset-password', request.url)
    successUrl.searchParams.set('validated', 'true')
    return NextResponse.redirect(successUrl)
  } catch (e: any) {
    const redirectUrl = new URL('/reset-password', request.url)
    redirectUrl.searchParams.set('error', 'true')
    const msg =
      /expired|otp_expired|access_denied/i.test(e?.message || '')
        ? 'Reset link expired or already used. Please request a new password reset.'
        : (e?.message || 'Something went wrong')
    redirectUrl.searchParams.set('message', msg)
    return NextResponse.redirect(redirectUrl)
  }
}


