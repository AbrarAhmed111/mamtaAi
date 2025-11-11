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

  const signinHref = useMemo(() => buildReturnUrl('/signin', returnUrl), [returnUrl])

  useEffect(() => {
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

  return (
    <div className="px-[24px] py-[10px] md:px-0 md:py-0">
      <AuthHeader
        title="Welcome to MamtaAi"
        subtitle={hasError ? 'Your verification link is invalid or has expired.' : 'Please verify your email address before signing in.'}
        label="VERIFY EMAIL"
        backHref="/"
      />

      <div className="mt-[24px] bg-white rounded-lg border border-gray-200 p-4">
        {!hasError ? (
          <>
            <p className="text-gray-700">
              We&apos;ve sent a verification link to{' '}
              <span className="font-semibold">{email}</span>. Please check your inbox and spam folder.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Redirecting to Sign In in {seconds}s...
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-700">
              {message || 'Email link is invalid or has expired. You can resend a new confirmation link below.'}
            </p>
            <div className="mt-3 max-w-md">
              <AuthInput
                placeholder="Email Address"
                value={typedEmail}
                onChange={e => setTypedEmail(e.target.value)}
              />
              {resendMsg && <div className="text-xs text-gray-600 mt-2">{resendMsg}</div>}
            </div>
          </>
        )}

        <div className="mt-4 flex gap-2">
          {!hasError ? (
            <>
              <AuthButton onClick={() => router.replace(signinHref)}>
                Go to Sign In
              </AuthButton>
              <AuthButton
                variant="secondary"
                onClick={() => router.refresh()}
              >
                I&apos;ve verified, refresh
              </AuthButton>
            </>
          ) : (
            <>
              <AuthButton
                onClick={async () => {
                  setResending(true)
                  setResendMsg('')
                  const { error } = await resendConfirmation(typedEmail)
                  setResendMsg(error ? error : 'Confirmation email sent. Please check your inbox.')
                  setResending(false)
                }}
                disabled={resending || !typedEmail}
              >
                {resending ? 'Sending...' : 'Resend confirmation email'}
              </AuthButton>
              <AuthButton onClick={() => router.replace(signinHref)} variant="secondary">
                Back to Sign In
              </AuthButton>
            </>
          )}
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


