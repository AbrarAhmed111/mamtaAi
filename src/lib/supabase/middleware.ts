import { createServerClient } from './server'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_PAGES = ['/signin', '/signup', '/welcome', '/forget-password', '/reset-password']
const PROTECTED_PATHS = ['/dashboard', '/onboarding']
const PUBLIC_PATHS = ['/', '/maintenance']

export async function updateSession(request: NextRequest) {
  const currentPath = request.nextUrl.pathname
  const supabase = await createServerClient()
  const supabaseResponse = NextResponse.next()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const isAuthPage = AUTH_PAGES.some(path => currentPath.startsWith(path))
  const isProtectedPath = PROTECTED_PATHS.some(path => currentPath.startsWith(path))
  const isPublicPath = PUBLIC_PATHS.includes(currentPath)

  // Allow recovery flow
  if (currentPath.startsWith('/reset-password')) return supabaseResponse

  if (user && !userError) {
    // Fetch role and verification only when needed
    let role: string | null = null
    let isVerified: boolean | null = null
    const ensureProfile = async () => {
      if (role !== null) return
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role, is_verified')
          .eq('id', user.id)
          .single()
        role = (data?.role as string) || null
        isVerified = (data?.is_verified as boolean) || false
      } catch {
        role = null
        isVerified = false
      }
    }
    // Redirect authenticated users away from auth pages (allow landing page '/')
    if (isAuthPage) {
      await ensureProfile()
      // Experts without approval should not land on dashboard
      if (role === 'expert' && !isVerified) {
        return NextResponse.redirect(new URL('/onboarding?status=pending', request.url))
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

    // Block experts without approval from protected pages
    if (isProtectedPath) {
      await ensureProfile()
      // If already on onboarding, allow to avoid redirect loops
      if (currentPath.startsWith('/onboarding')) {
        return supabaseResponse
      }
      if (role === 'expert' && !isVerified) {
        return NextResponse.redirect(new URL('/onboarding?status=pending', request.url))
      }
    }

    // Allow access to protected and public paths
    return supabaseResponse
  }

  // Unauthenticated
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


