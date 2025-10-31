import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const type = url.searchParams.get('type')

  // Only handle recovery/email change flows
  if (!code || !type) {
    const redirectUrl = new URL('/reset-password', request.url)
    redirectUrl.searchParams.set('error', 'true')
    redirectUrl.searchParams.set('message', 'Invalid reset link')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const redirectUrl = new URL('/reset-password', request.url)
      redirectUrl.searchParams.set('error', 'true')
      redirectUrl.searchParams.set('message', error.message)
      return NextResponse.redirect(redirectUrl)
    }

    const successUrl = new URL('/reset-password', request.url)
    successUrl.searchParams.set('validated', 'true')
    return NextResponse.redirect(successUrl)
  } catch (e: any) {
    const redirectUrl = new URL('/reset-password', request.url)
    redirectUrl.searchParams.set('error', 'true')
    redirectUrl.searchParams.set('message', e?.message || 'Something went wrong')
    return NextResponse.redirect(redirectUrl)
  }
}


