
'use client'

import { useState, useRef, useEffect } from 'react'
import { checkEmailAndRedirect } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import { getBaseUrl, AUTH_CONSTANTS } from '@/lib/constants'
import { validateEmail, validateEmailLive } from '@/lib/validations'
import { useReturnUrl } from '@/hooks/useReturnUrl'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'
import { PageProps } from '@/lib/interfaces/common'

export default function WelcomePage({ searchParams }: PageProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const returnUrl = useReturnUrl(searchParams)

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
          className={`mt-[24px] ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#002e6b] hover:opacity-90'}`}
        >
          Continue
        </AuthButton>
      </form>
    </div>
  )
}
