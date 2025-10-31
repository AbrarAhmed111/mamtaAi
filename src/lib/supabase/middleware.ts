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
    // Redirect authenticated users away from auth pages or root
    if (isAuthPage || currentPath === '/') {
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


