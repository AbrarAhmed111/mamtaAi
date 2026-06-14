import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isProfileSuspended } from '@/lib/admin/auth'
import { sessionInvalidResponse } from '@/lib/session/server'

const AUTH_PAGES = [
  '/signin',
  '/signup',
  '/welcome',
  '/forget-password',
  '/reset-password',
  '/auth/role',
  '/auth/expert-application',
  '/auth/expert-onboarding',
]
const EXPERT_SIGNUP_FLOW_PREFIXES = ['/auth/role', '/auth/expert-application', '/auth/expert-onboarding']
const PROTECTED_PATHS = ['/dashboard', '/onboarding']
const PUBLIC_PATHS = ['/', '/maintenance', '/pricing', '/billing/success', '/account-suspended']

/** API routes that skip live profile gate (webhooks, auth handshakes, public logging) */
const API_PUBLIC_PREFIXES = ['/api/auth/', '/api/webhooks/', '/api/log-error']

export async function updateSession(request: NextRequest) {
  const currentPath = request.nextUrl.pathname
  const supabase = await createServerClient()
  const supabaseResponse = NextResponse.next()

  if (currentPath.startsWith('/api/auth/') || currentPath.startsWith('/api/webhooks/')) {
    return NextResponse.next()
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const isAuthPage = AUTH_PAGES.some(path => currentPath.startsWith(path))
  const isProtectedPath = PROTECTED_PATHS.some(path => currentPath.startsWith(path))
  const isPublicPath = PUBLIC_PATHS.includes(currentPath)
  const isApiRoute = currentPath.startsWith('/api/')
  const isPublicApi =
    isApiRoute && API_PUBLIC_PREFIXES.some(prefix => currentPath.startsWith(prefix))

  if (currentPath.startsWith('/reset-password')) return supabaseResponse

  let role: string | null | undefined = undefined
  let metadata: Record<string, unknown> | null = null
  let profileExists = true

  let isExpert = false

  const ensureProfile = async () => {
    if (role !== undefined) return
    if (!user || userError) {
      role = null
      metadata = null
      profileExists = false
      isExpert = false
      return
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_expert, is_verified, metadata')
        .eq('id', user.id)
        .maybeSingle()
      if (error || !data) {
        role = null
        metadata = null
        profileExists = false
        isExpert = false
        return
      }
      role = (data.role as string) || null
      metadata = (data.metadata as Record<string, unknown>) ?? null
      profileExists = true
      const row = data as { is_expert?: boolean; is_verified?: boolean; role?: string }
      isExpert =
        row.is_expert === true || (row.role === 'expert' && row.is_verified === true)
    } catch {
      role = null
      metadata = null
      profileExists = false
      isExpert = false
    }
  }

  if (user && !userError) {
    if (isApiRoute && !isPublicApi) {
      await ensureProfile()
      if (!profileExists) {
        return sessionInvalidResponse('account_deleted')
      }
      if (isProfileSuspended(metadata)) {
        return sessionInvalidResponse('account_suspended')
      }
      return supabaseResponse
    }

    if (isAuthPage) {
      await ensureProfile()
      if (isProfileSuspended(metadata)) {
        return NextResponse.redirect(new URL('/account-suspended', request.url))
      }
      const inExpertSignupFlow = EXPERT_SIGNUP_FLOW_PREFIXES.some(prefix =>
        currentPath.startsWith(prefix),
      )
      if (inExpertSignupFlow) {
        return supabaseResponse
      }
      if (!role) {
        return NextResponse.redirect(new URL('/auth/role', request.url))
      }
      const returnUrl = request.nextUrl.searchParams.get('returnUrl')
      if (returnUrl) {
        try {
          const url = new URL(returnUrl, request.nextUrl.origin)
          if (url.origin === request.nextUrl.origin) return NextResponse.redirect(url)
        } catch {
          // Invalid URL; fall back to dashboard
        }
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isProtectedPath) {
      await ensureProfile()
      if (!profileExists) {
        const welcomeUrl = new URL('/welcome', request.url)
        welcomeUrl.searchParams.set('reason', 'account_deleted')
        return NextResponse.redirect(welcomeUrl)
      }
      if (isProfileSuspended(metadata) && !currentPath.startsWith('/account-suspended')) {
        return NextResponse.redirect(new URL('/account-suspended', request.url))
      }
      if (!role && !currentPath.startsWith('/auth/role')) {
        return NextResponse.redirect(new URL('/auth/role', request.url))
      }
      if (currentPath.startsWith('/dashboard/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      if (currentPath.startsWith('/dashboard/expert') && !isExpert) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return supabaseResponse
  }

  if (!user || userError) {
    if (isAuthPage || isPublicPath) return supabaseResponse

    if (isProtectedPath) {
      const welcomeUrl = new URL('/welcome', request.url)
      if (currentPath !== '/dashboard') {
        welcomeUrl.searchParams.set('returnUrl', request.url)
      }
      return NextResponse.redirect(welcomeUrl)
    }

    return supabaseResponse
  }

  return supabaseResponse
}
