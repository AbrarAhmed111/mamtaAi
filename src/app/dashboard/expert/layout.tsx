'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/context'
import { isVerifiedExpert } from '@/lib/expert/active-view'
import Spinner from '@/components/ui/spinner'

export default function ExpertSectionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user || !isVerifiedExpert(user.profile)) {
      router.replace('/dashboard')
    }
  }, [loading, user, router])

  if (loading || !user || !isVerifiedExpert(user.profile)) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  return <>{children}</>
}
