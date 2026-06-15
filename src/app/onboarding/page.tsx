'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthButton from '@/components/auth/AuthButton'
import AuthHeader from '@/components/auth/AuthHeader'
import { useAuth } from '@/lib/supabase/context'

async function ensureParentView() {
  try {
    await fetch('/api/profile/active-view', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active_view: 'parent' }),
    })
  } catch {
    // Non-fatal — unverified experts already default to parent view
  }
}

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signOut } = useAuth()
  const status = searchParams?.get('status')
  const [countdown, setCountdown] = useState<number | null>(null)

  const isPending = status === 'pending'

  useEffect(() => {
    if (!isPending) return

    setCountdown(5)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPending])

  useEffect(() => {
    if (!isPending || countdown !== 0) return

    void (async () => {
      await ensureParentView()
      router.replace('/dashboard')
    })()
  }, [isPending, countdown, router])

  return (
    <div className="w-full min-w-0 py-2">
      <div className="text-center">
        <AuthHeader
          title={isPending ? 'Your application is under review' : 'Complete your onboarding'}
          subtitle={
            isPending
              ? 'Thanks for submitting your expert documents. Our team is reviewing your application. You will be notified once approved.'
              : 'Please complete your onboarding details to unlock full access.'
          }
          label="EXPERT"
          onBack={() => router.push('/dashboard')}
        />

        <div className="mx-auto mb-6 mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <span className="text-2xl text-amber-600">⌛</span>
        </div>

        {isPending && (
          <>
            <div className="text-sm text-gray-500">Typical review time: 1–3 business days.</div>
            {countdown !== null && countdown > 0 && (
              <div className="mt-8">
                <p className="mb-2 text-sm text-gray-500">Redirecting to your dashboard in</p>
                <p className="text-5xl font-bold tabular-nums text-pink-600">{countdown}</p>
              </div>
            )}
            {countdown === 0 && (
              <p className="mt-8 text-sm font-medium text-pink-600">Opening parent dashboard…</p>
            )}
          </>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <AuthButton onClick={() => router.push('/dashboard')} className="!mt-0 sm:flex-1">
            Go to dashboard
          </AuthButton>
          <AuthButton variant="secondary" onClick={() => router.refresh()} className="!mt-0 sm:flex-1">
            Refresh status
          </AuthButton>
          <AuthButton
            variant="secondary"
            onClick={async () => {
              try {
                await signOut()
              } finally {
                router.push('/welcome')
              }
            }}
            className="!mt-0 sm:flex-1"
          >
            Logout
          </AuthButton>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  )
}


