'use server'

import { createServerClient as createSupabaseClient, type CookieOptions } from '@supabase/ssr'
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const rawCookies = await cookies()
  const cookieStore = rawCookies as UnsafeUnwrappedCookies

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions: CookieOptions = {
                ...options,
                domain: undefined,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch {
            // Safe to ignore when called from Server Components
          }
        },
      },
    },
  )
}

export const createServerClient = createClient


