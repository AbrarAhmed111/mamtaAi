import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

type PendingCookie = { name: string; value: string; options: any }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const sbError = searchParams.get('error')
  const sbErrorCode = searchParams.get('error_code')

  const errorRedirect = (message: string) => {
    const url = new URL('/reset-password', request.url)
    url.searchParams.set('error', 'true')
    url.searchParams.set('message', message)
    return NextResponse.redirect(url)
  }

  // Build the success redirect, applying the recovery-session cookies with their
  // real options (path, maxAge, httpOnly, secure, sameSite) so the session persists.
  const successRedirect = (pendingCookies: PendingCookie[]) => {
    const successUrl = new URL('/reset-password', request.url)
    successUrl.searchParams.set('validated', 'true')
    const res = NextResponse.redirect(successUrl)
    const isLocalhost =
      successUrl.origin.startsWith('http://localhost') ||
      successUrl.origin.startsWith('http://127.0.0.1')
    pendingCookies.forEach(({ name, value, options }) => {
      const opts = { ...options }
      if (isLocalhost) {
        // Localhost is http, so a "secure" cookie would be dropped by the browser
        opts.secure = false
        opts.domain = undefined
        opts.sameSite = 'lax'
      }
      res.cookies.set(name, value, opts)
    })
    return res
  }

  const makeClient = (pendingCookies: PendingCookie[]) =>
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: cookiesToSet => {
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.push({ name, value, options })
            })
          },
        },
      },
    )

  // Supabase-provided error states (e.g. otp_expired) on the callback URL
  if (sbError) {
    return errorRedirect(
      sbErrorCode === 'otp_expired'
        ? 'Password reset link has expired. Please request a new one.'
        : 'Invalid reset link. Please request a new password reset.',
    )
  }

  // Primary path: app-generated recovery token verified here (no PKCE verifier
  // or Supabase redirect allow-list needed). Emailed via our own SMTP.
  if (tokenHash && type) {
    const pendingCookies: PendingCookie[] = []
    const supabase = makeClient(pendingCookies)
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash: tokenHash,
    })
    if (error || !data?.session || !data?.user) {
      return errorRedirect(
        /expired|invalid|not.*found/i.test(error?.message || '')
          ? 'Reset link expired or already used. Please request a new password reset.'
          : 'Invalid or expired reset link. Please request a new password reset.',
      )
    }
    return successRedirect(pendingCookies)
  }

  // Legacy path: links that carry a PKCE authorization code
  if (code) {
    const pendingCookies: PendingCookie[] = []
    const supabase = makeClient(pendingCookies)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data?.session || !data?.user) {
      return errorRedirect(
        /expired|otp_expired|access_denied/i.test(error?.message || '')
          ? 'Reset link expired or already used. Please request a new password reset.'
          : 'Invalid or expired reset link. Please request a new password reset.',
      )
    }
    return successRedirect(pendingCookies)
  }

  return errorRedirect('Invalid reset link. Please request a new password reset.')
}
