import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const token = url.searchParams.get('token') || url.searchParams.get('token_hash')
  const type = (url.searchParams.get('type') || 'signup') as string

  try {
    const supabase = await createServerClient()
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
    }

    const okUrl = new URL('/signin', request.url)
    okUrl.searchParams.set('verified', '1')
    return NextResponse.redirect(okUrl)
  } catch (e: any) {
    const errUrl = new URL('/verify-email', request.url)
    errUrl.searchParams.set('error', 'true')
    errUrl.searchParams.set('message', e?.message || 'Verification failed')
    return NextResponse.redirect(errUrl)
  }
}


