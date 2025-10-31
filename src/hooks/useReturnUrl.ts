'use client'

import { useMemo } from 'react'

export function useReturnUrl(searchParams: any): string | undefined {
  return useMemo(() => {
    try {
      const params = searchParams as Record<string, string | string[] | undefined>
      const val = params?.returnUrl
      if (!val) return undefined
      if (Array.isArray(val)) return val[0]
      return val
    } catch {
      return undefined
    }
  }, [searchParams])
}


