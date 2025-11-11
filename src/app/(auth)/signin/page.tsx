

'use client'

import React, { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { resendConfirmation, signin } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AUTH_CONSTANTS, buildReturnUrl } from '@/lib/constants'
import { useReturnUrl } from '@/hooks/useReturnUrl'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'
 

function SignInContent() {
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const returnUrl = useReturnUrl()
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const qs = useSearchParams()
  const wasVerified = qs?.get('verified') === '1'

  const router = useRouter()
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMounted(true)

    const authEmail = localStorage.getItem(
      AUTH_CONSTANTS.STORAGE_KEYS.AUTH_EMAIL,
    )
    if (!authEmail) {
      router.push(buildReturnUrl(AUTH_CONSTANTS.ROUTES.WELCOME, returnUrl))
    } else {
      setEmail(authEmail)
      setTimeout(() => {
        passwordInputRef.current?.focus()
      }, 50)
    }
  }, [router, returnUrl])

  const handleBack = () => {
    router.push(buildReturnUrl(AUTH_CONSTANTS.ROUTES.WELCOME, returnUrl))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      setError('')
      setIsLoading(true)

      const result = await signin(formData, returnUrl)

      if (result?.error) {
        setError(result.error)
        return
      }

      localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.AUTH_EMAIL)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="px-[24px] py-[10px] md:px-0 md:py-0">
      <AuthHeader
        title="Enter your password"
        subtitle={`We've found an account associated with ${email}. Please enter your password to continue.`}
        label="SIGN IN"
        onBack={handleBack}
      />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[16px] sm:gap-[24px] mt-[24px]"
      >
        <input type="hidden" name="email" value={email} />

        <div className="flex flex-col items-end gap-[16px]">
          <AuthInput
            ref={passwordInputRef}
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              if (e.target.value) setPasswordError('')
            }}
            onBlur={() => {
              if (!password)
                setPasswordError(
                  AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORD_REQUIRED,
                )
            }}
            error={passwordError || error}
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          <Link
            href={buildReturnUrl(
              AUTH_CONSTANTS.ROUTES.FORGET_PASSWORD,
              returnUrl,
            )}
            className="flex justify-end text-sm mt-2"
          >
            <button type="button" className="text-[#002e6b] hover:underline">
              Forgot password?
            </button>
          </Link>
          {error?.toLowerCase().includes('verify') || error?.toLowerCase().includes('confirm') ? (
            <div className="w-full text-xs text-red-900 bg-red-50 border border-yellow-200 rounded p-2 mt-2">
              Please verify your email to sign in.{" "}
              <button
                type="button"
                disabled={resending}
                onClick={async () => {
                  setResending(true)
                  setResendMsg('')
                  const addr = email
                  if (!addr) {
                    setResendMsg('Email not found. Go back and enter your email again.')
                    setResending(false)
                    return
                  }
                  const { success, error: e } = await resendConfirmation(addr)
                  setResendMsg(success || e || '')
                  setResending(false)
                }}
                className="text-[#002e6b] underline ml-1 disabled:opacity-50"
              >
                Resend confirmation email
              </button>
              {resendMsg && <div className="mt-1 text-xs text-gray-700">{resendMsg}</div>}
            </div>
          ) : null}
        </div>

        {wasVerified && (
          <div className="w-full text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2 -mt-2">
            Your email has been verified. Please sign in to continue.
          </div>
        )}

        <div className="absolute md:static right-[3%] justify-center flex items-center bottom-2 w-[94%] md:w-full mx-auto">
          <AuthButton
            type="submit"
            disabled={!password}
            loading={isLoading}
            loadingText="Signing in..."
            className="w-[95%] sm:w-full"
          >
            Sign In
          </AuthButton>
        </div>
      </form>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="px-[24px] py-[10px] md:px-0 md:py-0">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}
