'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthButton from '@/components/auth/AuthButton'
import { useAuth } from '@/lib/supabase/context'

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signOut } = useAuth()
  const status = searchParams?.get('status')

  const isPending = status === 'pending'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-yellow-600 text-2xl">⌛</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isPending ? 'Your application is under review' : 'Complete your onboarding'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isPending
              ? 'Thanks for submitting your expert documents. Our team is reviewing your application. You will be notified once approved.'
              : 'Please complete your onboarding details to unlock full access.'}
          </p>

          {isPending && (
            <div className="mt-4 text-sm text-gray-500">
              Typical review time: 1–3 business days.
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <AuthButton
              onClick={() => router.push('/')}
              className="!mt-0"
            >
              Go to Home
            </AuthButton>
            <AuthButton
              variant="secondary"
              onClick={() => router.refresh()}
              className="!mt-0"
            >
              Refresh Status
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
              className="!mt-0"
            >
              Logout
            </AuthButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}


