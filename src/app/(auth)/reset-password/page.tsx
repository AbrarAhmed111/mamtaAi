

'use client'

import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { updatePasswordAction } from '@/lib/actions/auth'
import { AUTH_CONSTANTS } from '@/lib/constants'
import { validatePassword } from '@/lib/validations'
import { useReturnUrl } from '@/hooks/useReturnUrl'
import { createClient } from '@/lib/supabase/client'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'
import PasswordRequirements from '@/components/auth/PasswordRequirements'
import { PageProps } from '@/lib/interfaces/common'

export default function ResetPasswordPage({ searchParams }: PageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  )
  const [isLoading, setIsLoading] = useState(false)
  const [sessionValid, setSessionValid] = useState<boolean | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)
  const returnUrl = useReturnUrl(searchParams)

  const router = useRouter()
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const passwordValidation = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: typeof errors = {}
    if (!passwordValidation.isValid) {
      newErrors.password = AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORD_INVALID
    }
    if (password !== confirmPassword) {
      newErrors.confirm = AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORDS_DONT_MATCH
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      await updatePasswordAction(password)
      // Success toast and redirect handled by server action
    } catch (error) {
      // Don't show toast for NEXT_REDIRECT - it's expected behavior
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT'))
        return
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update password. Please try again.',
      )
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const validateSession = async () => {
      try {
        const params = await searchParams
        if (params.error) {
          setSessionValid(false)
          setResetError(
            params.message ??
              'Invalid or expired reset link. Please request a new password reset.',
          )
          return
        }
        // Handle successful validation from API route
        if (params.validated === 'true' || params.validated) {
          // Verify we have an authenticated session
          const supabase = createClient()
          const { data, error: authError } = await supabase.auth.getUser()

          if (authError || !data.user) {
            console.error('Session validation failed:', {
              authError,
              user: data.user,
            })
            setSessionValid(false)
            setResetError(
              'Session expired. Please request a new password reset.',
            )
            return
          }

          setSessionValid(true)
          passwordInputRef.current?.focus()
          return
        }

        setSessionValid(false)
        setResetError('Please use the link from your password reset email.')
      } catch (err) {
        console.error('Error validating session:', err)
        setSessionValid(false)
        setResetError('Something went wrong. Please try again.')
      }
    }

    validateSession()
  }, [searchParams])

  // Show loading while validating session
  if (sessionValid === null) {
    return (
      <div className="px-[24px] py-[10px] md:px-0 md:py-0">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error message if session is invalid
  if (sessionValid === false) {
    return (
      <div className="px-[24px] py-[10px] md:px-0 md:py-0">
        <AuthHeader
          title="Reset your password"
          subtitle="Create a new password for your account."
          backHref="/signin"
          label="RESET PASSWORD"
          returnUrl={returnUrl}
        />

        <div className="mt-[24px]">
          <div className="text-red-500 text-sm mb-2">{resetError}</div>
          <button
            onClick={() => router.push('/forget-password')}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Request a new password reset
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-[24px] py-[10px] md:px-0 md:py-0">
      <AuthHeader
        title="Reset your password"
        subtitle="Create a new password for your account."
        backHref="/signin"
        label="RESET PASSWORD"
        returnUrl={returnUrl}
      />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[16px] mt-[24px]"
      >
        {/* Password Input */}
        <AuthInput
          ref={passwordInputRef}
          type={showPassword ? 'text' : 'password'}
          placeholder="New Password"
          value={password}
          onChange={e => {
            setPassword(e.target.value)
            setErrors(prev => ({ ...prev, password: '' }))
          }}
          onBlur={() => {
            if (!password) {
              setErrors(prev => ({
                ...prev,
                password: AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORD_REQUIRED,
              }))
            } else if (!passwordValidation.isValid) {
              setErrors(prev => ({
                ...prev,
                password: AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORD_INVALID,
              }))
            }
          }}
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          error={errors.password}
        />

        <PasswordRequirements password={password} isVisible={!!password} />

        {/* Confirm Password Input */}
        <AuthInput
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={e => {
            setConfirmPassword(e.target.value)
            setErrors(prev => ({ ...prev, confirm: '' }))
          }}
          onBlur={() => {
            if (!confirmPassword) {
              setErrors(prev => ({
                ...prev,
                confirm: 'Please confirm your password',
              }))
            } else if (password !== confirmPassword) {
              setErrors(prev => ({
                ...prev,
                confirm: AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
              }))
            }
          }}
          showPasswordToggle
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          error={errors.confirm}
        />

        <AuthButton
          type="submit"
          disabled={!passwordValidation.isValid || password !== confirmPassword}
          loading={isLoading}
          loadingText="Updating Password..."
          className="mt-[24px]"
        >
          Update Password
        </AuthButton>
      </form>
    </div>
  )
}
