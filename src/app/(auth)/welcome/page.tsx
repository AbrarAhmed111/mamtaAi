

'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { checkEmailAndRedirect } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import { getBaseUrl, AUTH_CONSTANTS } from '@/lib/constants'
import { validateEmail, validateEmailLive } from '@/lib/supabase/validations'
import { useReturnUrl } from '@/hooks/useReturnUrl'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'
import { supabase } from '@/lib/supabase/client'
 

function WelcomeContent() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const returnUrl = useReturnUrl()

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setEmailError(
        emailValidation.error || AUTH_CONSTANTS.ERROR_MESSAGES.EMAIL_INVALID,
      )
      return
    }

    setEmailError('')
    setLoading(true)

    try {
      const result = await checkEmailAndRedirect(email)

      if (result.error) {
        setEmailError(result.error)
        return
      }

      localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.AUTH_EMAIL, email)

      if (result.status === 'signin') {
        router.push(
          `/signin${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`,
        )
      } else if (result.status === 'signup') {
        router.push(
          `/signup${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`,
        )
      }
    } catch (error) {
      setEmailError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (!emailError && email) {
      timeout = setTimeout(() => {
        setEmailError('')
      }, 200)
    }

    return () => clearTimeout(timeout)
  }, [email, emailError])

  const handleEmailBlur = (value: string): void => {
    const validation = validateEmail(value)
    setEmailError(validation.error || '')
  }

  const handleEmailLiveValidation = (value: string): void => {
    if (validateEmailLive(value)) {
      setEmailError('')
    }
  }
  const handleGoogleLogin = async () => {
    const params = new URLSearchParams()
    if (returnUrl) params.set('returnUrl', returnUrl)
    const target = `/api/auth/login${params.toString() ? `?${params.toString()}` : ''}`
    if (typeof window !== 'undefined') {
      window.location.href = target
    }
  }

  return (
    <div className="px-[24px] py-[10px] md:px-0 md:py-0">
      <AuthHeader
        title="Enter your email"
        backHref={getBaseUrl()}
        label="SIGN UP OR SIGN IN"
        returnUrl={returnUrl}
      />

      <form onSubmit={handleSubmit} className="mt-[24px]">
        <AuthInput
          ref={emailInputRef}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email Address"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value
            setEmail(value)
            handleEmailLiveValidation(value)
          }}
          onBlur={() => handleEmailBlur(email)}
          error={emailError}
        />

        <AuthButton
          type="submit"
          disabled={loading}
          loading={loading}
          loadingText="Verifying user..."
          className="mt-[24px]"
        >
          Continue
        </AuthButton>
      </form>

      <div className="mt-4">
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full gap-3 rounded-2xl min-h-[46px] md:min-h-[56px] border-2 border-pink-200 bg-white px-4 py-2.5 sm:py-3 text-sm sm:text-[16px] font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:bg-pink-50 hover:border-pink-300 hover:shadow-md"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.61 1.22 9.06 3.6l6.75-6.75C35.37 2.89 29.97 0 24 0 14.72 0 6.73 5.58 2.69 13.72l7.89 6.12C12.26 13.19 17.64 9.5 24 9.5z"
            />
            <path
              fill="#34A853"
              d="M46.1 24.5c0-1.56-.14-3.06-.39-4.5H24v9.05h12.4c-.54 2.77-2.17 5.12-4.61 6.71l7.18 5.56C43.84 37.66 46.1 31.5 46.1 24.5z"
            />
            <path
              fill="#FBBC05"
              d="M10.58 28.84a14.52 14.52 0 0 1 0-9.68l-7.89-6.12A23.94 23.94 0 0 0 0 24c0 3.91.94 7.6 2.69 10.96l7.89-6.12z"
            />
            <path
              fill="#4285F4"
              d="M24 48c6.48 0 11.92-2.13 15.89-5.78l-7.18-5.56c-2 1.35-4.57 2.13-7.71 2.13-6.36 0-11.74-3.69-14.42-9.02l-7.89 6.12C6.73 42.42 14.72 48 24 48z"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="px-[24px] py-[10px] md:px-0 md:py-0">Loading...</div>}>
      <WelcomeContent />
    </Suspense>
  )
}
