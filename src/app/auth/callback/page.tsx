'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const finalizeAuth = async () => {
      try {
        const currentUrl = new URL(window.location.href)
        const returnUrl = searchParams.get('returnUrl') || ''
        const code = currentUrl.searchParams.get('code')

        // Handle both code flow and hash fragment flow
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        } else {
          // With detectSessionInUrl enabled in the client, simply accessing the page
          // processes the URL hash (#access_token=...) and stores the session.
          // We just ensure the session is available.
          await supabase.auth.getSession()
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.replace(
            '/signin?error=true&message=' +
              encodeURIComponent('OAuth failed'),
          )
          return
        }

        // Safe redirect: only allow same-origin returnUrl
        if (returnUrl) {
          try {
            const candidate = new URL(returnUrl, window.location.origin)
            if (candidate.origin === window.location.origin) {
              router.replace(candidate.toString())
              return
            }
          } catch {
            // ignore malformed returnUrl
          }
        }

        router.replace('/dashboard')
      } catch (e: any) {
        router.replace(
          '/signin?error=true&message=' +
            encodeURIComponent(e?.message || 'OAuth failed'),
        )
      }
    }

    finalizeAuth()
  }, [router, searchParams])

  return (
    <div className="px-[24px] py-[10px] md:px-0 md:py-0">Loading...</div>
  )
}


