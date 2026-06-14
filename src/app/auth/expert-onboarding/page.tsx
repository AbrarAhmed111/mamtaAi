'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/spinner'

/** Legacy route — redirects to the full expert application flow. */
export default function ExpertOnboardingRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/expert-application')
  }, [router])

  return (
    <div className="flex justify-center py-16">
      <Spinner size={28} />
    </div>
  )
}
