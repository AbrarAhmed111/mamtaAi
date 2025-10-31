
'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { forgotPassword } from '@/lib/actions/auth'
import Mailbox from '@/assets/img/mailbox.png'
import { Poppins } from 'next/font/google'
import { AUTH_CONSTANTS } from '@/lib/constants'
import { validateEmail } from '@/lib/validations'
import { useReturnUrl } from '@/hooks/useReturnUrl'
import AuthHeader from '@/components/auth/helper/AuthHeader'
import AuthInput from '@/components/auth/helper/AuthInput'
import AuthButton from '@/components/auth/helper/AuthButton'
import { PageProps } from '@/lib/interfaces/common'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700', '400'],
})
export default function ForgetPasswordPage({ searchParams }: PageProps) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const returnUrl = useReturnUrl(searchParams)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMounted(true)
    emailInputRef.current?.focus()

    const authEmail = localStorage.getItem(
      AUTH_CONSTANTS.STORAGE_KEYS.AUTH_EMAIL,
    )
    if (authEmail) {
      setEmail(authEmail)
    }
  }, [])

  const handleBack = () => setStep(1)

  const handleResetPassword = async () => {
    const emailValidation = validateEmail(email)
    if (emailValidation.isValid) {
      setLoading(true)
      setMessage('')
      const result = await forgotPassword(email)
      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage(result.success || '')
        setStep(2)
      }
      setLoading(false)
    } else {
      setMessage(
        emailValidation.error || AUTH_CONSTANTS.ERROR_MESSAGES.EMAIL_INVALID,
      )
    }
  }

  const handleResendEmail = async () => {
    setResendLoading(true)
    setMessage('')

    const result = await forgotPassword(email)

    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage(
        'Password reset email has been resent. Please check your inbox.',
      )
    }

    setResendLoading(false)
  }

  if (!isMounted) return null

  return (
    <div className="px-[24px] py-[10px] md:px-0 md:py-0">
      <div className="w-full">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1">
              <div className="max-w-[500px] w-full">
                <AuthHeader
                  title="Forgot password"
                  subtitle="Enter the email associated with your account to receive a password reset link."
                  backHref="/signin"
                  label="FORGOT PASSWORD"
                  returnUrl={returnUrl}
                />

                <form
                  onSubmit={e => {
                    e.preventDefault()
                    const emailValidation = validateEmail(email)
                    if (!loading && emailValidation.isValid) {
                      handleResetPassword()
                    } else {
                      setEmailError(
                        emailValidation.error ||
                          AUTH_CONSTANTS.ERROR_MESSAGES.EMAIL_INVALID,
                      )
                    }
                  }}
                  className="mt-[24px]"
                >
                  <AuthInput
                    ref={emailInputRef}
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                    onBlur={() => {
                      const validation = validateEmail(email)
                      setEmailError(validation.error || '')
                    }}
                    error={emailError}
                  />

                  {message && (
                    <div
                      className={`mt-2 text-sm ${
                        message.includes('success')
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <div className="mt-[24px]">
                    <AuthButton
                      type="submit"
                      disabled={!validateEmail(email).isValid}
                      loading={loading}
                      loadingText="Sending..."
                    >
                      Reset Password
                    </AuthButton>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="step2">
              <div className="mx-auto">
                <div className="flex flex-col items-center md:items-start gap-[24px] mt-10 sm:mt-0">
                  <Image
                    src={Mailbox}
                    alt="Mailbox"
                    className="w-[120px] py-[48px] px-[15px] md:px-0 md:py-0"
                    priority
                  />
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-1 text-lg sm:text-3xl font-bold text-center justify-center md:text-start">
                      <h1
                        className={`${poppins.className} text-2xl lg:text-3xl xl:text-4xl font-bold mb-1`}
                      >
                        We&apos;ve sent an email to {email}
                      </h1>
                    </div>
                    <span className="text-[#66696D] text-[16px] leading-[150%] tracking-[-0.5px] font-medium md:text-lg xl:text-[22px] text-center md:text-start">
                      Check your inbox for instructions on how to reset your
                      password. If you don&apos;t receive an email, check your
                      junk/spam or resend below.
                    </span>
                  </div>
                  <AuthButton
                    onClick={handleResendEmail}
                    disabled={resendLoading}
                    loading={resendLoading}
                    loadingText="Resending..."
                    variant="secondary"
                    className="mt-[16px]"
                  >
                    Resend Email
                  </AuthButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
