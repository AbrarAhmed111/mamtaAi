

'use client'

import React, { useEffect, useState, useRef } from 'react'
import { signup } from '@/lib/actions/auth'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AUTH_CONSTANTS, buildReturnUrl } from '@/lib/constants'
import {
  validateEmail,
  validatePassword,
  isValidPassword,
} from '@/lib/validations'
import { useReturnUrl } from '@/hooks/useReturnUrl'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'
import PasswordRequirements from '@/components/auth/PasswordRequirements'
import { PageProps } from '@/lib/interfaces/common'

export default function SignUpPage({ searchParams }: PageProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{
    email?: string
    name?: string
    surname?: string
    password?: string
  }>({})
  const [isTyping, setIsTyping] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nameError, setNameError] = useState('')
  const returnUrl = useReturnUrl(searchParams)

  const passwordInputRef = useRef<HTMLInputElement>(null)
  const firstNameInputRef = useRef<HTMLInputElement>(null)

  const passwordValidation = validatePassword(password)

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.push(buildReturnUrl(AUTH_CONSTANTS.ROUTES.WELCOME, returnUrl))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!firstName || !lastName) {
      setNameError(AUTH_CONSTANTS.ERROR_MESSAGES.NAME_REQUIRED)
      return
    }

    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      toast.error(
        emailValidation.error || AUTH_CONSTANTS.ERROR_MESSAGES.EMAIL_INVALID,
      )
      return
    }

    if (!isValidPassword(password)) {
      toast.error(AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORD_INVALID)
      return
    }

    setIsLoading(true)
    setNameError('')

    try {
      const fd = new FormData()
      fd.append('first-name', firstName)
      fd.append('last-name', lastName)
      fd.append('email', email)
      fd.append('password', password)

      const res = await signup(fd)

      if (res?.success) {
        toast.success(AUTH_CONSTANTS.SUCCESS_MESSAGES.SIGNUP_SUCCESS)
        router.push(buildReturnUrl(AUTH_CONSTANTS.ROUTES.SIGNIN, returnUrl))
        localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.AUTH_EMAIL)
      }
    } catch (err) {
      console.error('Signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function nextStep() {
    setStep(2)
  }

  useEffect(() => {
    if (step === 1) {
      passwordInputRef.current?.focus()
    } else if (step === 2) {
      firstNameInputRef.current?.focus()
    }
  }, [step])

  useEffect(() => {
    setIsMounted(true)

    const authEmail = localStorage.getItem(
      AUTH_CONSTANTS.STORAGE_KEYS.AUTH_EMAIL,
    )
    if (!authEmail) {
      router.push(buildReturnUrl(AUTH_CONSTANTS.ROUTES.WELCOME, returnUrl))
    } else {
      setEmail(authEmail)
    }
  }, [router, returnUrl])

  if (!isMounted) return null

  return (
    <div>
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="step1" className="w-full">
            <div className="px-[24px] py-[10px] h-screen md:h-auto sm:px-8 lg:px-0 sm:py-[10px] max-w-full lg:max-w-[500px]">
              <AuthHeader
                title="Create your account password"
                label="SIGN UP"
                onBack={handleBack}
                returnUrl={returnUrl}
              />

              <div className="mt-[24px]">
                <AuthInput
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (e.target.value)
                      setErrors(prev => ({ ...prev, password: '' }))
                  }}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => {
                    setIsTyping(false)
                    if (!password) {
                      setErrors(prev => ({
                        ...prev,
                        password: 'Password is required.',
                      }))
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const newErrors: typeof errors = {}

                      if (!passwordValidation.isValid) {
                        newErrors.password =
                          'Password must be at least 8 characters, include uppercase, lowercase, and special character'
                      }

                      if (Object.keys(newErrors).length) {
                        setErrors(newErrors)
                        return
                      }

                      setErrors({})
                      nextStep()
                    }
                  }}
                  showPasswordToggle
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  error={errors.password}
                />
              </div>

              <PasswordRequirements
                password={password}
                isVisible={isTyping || !!password}
                showPlaceholder={!password}
                iconSize={20}
                textSize="text-sm"
              />

              <div className="absolute md:static bottom-2 md:w-full w-[88%] mx-auto">
                <AuthButton
                  onClick={() => {
                    const newErrors: typeof errors = {}

                    if (!passwordValidation.isValid) {
                      newErrors.password =
                        'Password must be at least 8 characters, include uppercase, lowercase, and special character'
                    }

                    if (Object.keys(newErrors).length) {
                      setErrors(newErrors)
                      return
                    }

                    setErrors({})
                    nextStep()
                  }}
                  disabled={!passwordValidation.isValid}
                  className="mt-4"
                >
                  Next
                </AuthButton>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="step2">
            <div className="px-[24px] py-[10px]">
              <div className="flex md:block flex-col h-screen md:h-auto justify-between">
                <div className="py-[10px]">
                  <AuthHeader
                    title="What's your name?"
                    label="SIGN UP"
                    onBack={handleBack}
                    returnUrl={returnUrl}
                  />

                  <div className="mt-[24px] space-y-4">
                    <AuthInput
                      ref={firstNameInputRef}
                      placeholder="First Name"
                      value={firstName}
                      onChange={e => {
                        setFirstName(e.target.value)
                        if (e.target.value) setNameError('')
                      }}
                      onBlur={() => {
                        if (!firstName) setNameError('First name is required.')
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const lastNameInput = document.getElementById(
                            'lastNameInput',
                          ) as HTMLInputElement
                          lastNameInput?.focus()
                        }
                      }}
                    />

                    <AuthInput
                      id="lastNameInput"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={e => {
                        setLastName(e.target.value)
                        if (e.target.value) setNameError('')
                      }}
                      onBlur={() => {
                        if (!lastName) setNameError('Last name is required.')
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (firstName && lastName) {
                            const form = document.getElementById(
                              'signupFormStep2',
                            ) as HTMLFormElement
                            form?.requestSubmit()
                          }
                        }
                      }}
                      error={nameError}
                    />
                  </div>

                  <form
                    className="md:block hidden"
                    id="signupFormStep2"
                    onSubmit={handleSubmit}
                  >
                    <AuthButton
                      type="submit"
                      disabled={!firstName || !lastName}
                      loading={isLoading}
                      loadingText="Creating account..."
                      className="my-6 sm:my-8"
                    >
                      Create Account
                    </AuthButton>
                  </form>
                </div>

                <div>
                  <div className="py-4">
                    <p className="text-[#AAADB1] text-xs sm:text-sm">
                      By tapping &quot;Create Account&quot;, you agree to the
                      Nizam Terms of Use.
                    </p>
                    <button className="text-[#002e6b] font-bold text-xs sm:text-sm">
                      Terms of Use
                    </button>
                  </div>
                  <div className="pb-4">
                    <p className="text-[#AAADB1] text-xs sm:text-sm">
                      To learn more about how Nizam collects, uses, shares, and
                      protects your personal data, please see the Nizam Privacy.
                    </p>
                    <button className="text-[#002e6b] font-bold text-xs sm:text-sm">
                      Privacy Policy
                    </button>
                  </div>
                  <form
                    className="md:hidden mb-4"
                    id="signupFormStep2"
                    onSubmit={handleSubmit}
                  >
                    <AuthButton
                      type="submit"
                      disabled={!firstName || !lastName}
                      loading={isLoading}
                      loadingText="Creating account..."
                      className="mt-6 sm:mt-12"
                    >
                      Create Account
                    </AuthButton>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
