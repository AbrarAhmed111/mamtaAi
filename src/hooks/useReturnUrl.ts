'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

export function useReturnUrl(): string | undefined {
  const searchParams = useSearchParams()

  return useMemo(() => {
    try {
      if (!searchParams) return undefined
      const value = searchParams.get('returnUrl')
      return value || undefined
    } catch {
      return undefined
    }
  }, [searchParams])
}

