'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthButton from '@/components/auth/AuthButton'
import { buildReturnUrl } from '@/lib/constants'
import { resendConfirmation } from '@/lib/actions/auth'
import AuthInput from '@/components/auth/AuthInput'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams?.get('email') || ''
  const returnUrl = searchParams?.get('returnUrl') || undefined
  const [seconds, setSeconds] = useState(10)
  const hasError = searchParams?.get('error') === 'true' || !!searchParams?.get('message')
  const message = searchParams?.get('message') || ''
  const [typedEmail, setTypedEmail] = useState(email)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const signinHref = useMemo(() => buildReturnUrl('/welcome', returnUrl), [returnUrl])

  useEffect(() => {
    if (hasError) {
      // On any error, immediately redirect to Sign In without showing this page
      router.replace(signinHref)
      return
    }
    if (hasError) return
    const interval = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000)
    const timeout = setTimeout(() => {
      router.replace(signinHref)
    }, 10000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router, signinHref, hasError])

  // Prevent rendering the error UI during redirect for presentations
  if (hasError) {
    return null
  }

  return (
    <div className="px-[24px] py-[10px] md:px-0 md:py-0">
      <AuthHeader
        title="Welcome to MamtaAi"
        subtitle={'Please verify your email address before signing in.'}
        label="VERIFY EMAIL"
        backHref="/"
      />

      <div className="mt-[24px] bg-white rounded-lg border border-gray-200 p-4">
        <>
          <p className="text-gray-700">
            We&apos;ve sent a verification link to{' '}
            <span className="font-semibold">{email}</span>. Please check your inbox and spam folder.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting to Sign In in {seconds}s...
          </p>
        </>

        <div className="mt-4 flex gap-2">
          <>
            <AuthButton onClick={() => router.replace(signinHref)}>
              Go to Welcome
            </AuthButton>
            <AuthButton
              variant="secondary"
              onClick={() => router.refresh()}
            >
              I&apos;ve verified, refresh
            </AuthButton>
          </>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="px-[24px] py-[10px] md:px-0 md:py-0">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}


