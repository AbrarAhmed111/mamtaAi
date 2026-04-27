


'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { signup } from '@/lib/actions/auth'
import { toast } from '@/components/ui/sonner'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AUTH_CONSTANTS, buildReturnUrl } from '@/lib/constants'
import {
  validateEmail,
  validatePassword,
  isValidPassword,
} from '@/lib/supabase/validations'
import { useReturnUrl } from '@/hooks/useReturnUrl'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'
import PasswordRequirements from '@/components/auth/PasswordRequirements'
 

function SignUpContent() {
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
  const [role, setRole] = useState<'parent' | 'expert' | ''>('')
  const [professionalTitle, setProfessionalTitle] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const docsInputRef = useRef<HTMLInputElement>(null)
  const [expTitleError, setExpTitleError] = useState('')
  const [expLicenseError, setExpLicenseError] = useState('')
  const [expYearsError, setExpYearsError] = useState('')
  const [expDocsError, setExpDocsError] = useState('')
  const returnUrl = useReturnUrl()
  const isInviteFlow = Boolean(returnUrl && /\/invite\//.test(returnUrl))

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

    if (!role) {
      toast.error('Please select your role')
      return
    }

    if (role === 'expert') {
      // Validate expert fields
      let hasError = false

      if (!professionalTitle.trim()) {
        setExpTitleError('Professional title is required')
        hasError = true
      } else {
        setExpTitleError('')
      }

      if (!licenseNumber.trim()) {
        setExpLicenseError('License number is required')
        hasError = true
      } else {
        setExpLicenseError('')
      }

      const yearsNum = Number(yearsOfExperience)
      if (!yearsOfExperience || Number.isNaN(yearsNum) || yearsNum < 0 || yearsNum > 80 || !Number.isInteger(yearsNum)) {
        setExpYearsError('Years of experience must be an integer between 0 and 80')
        hasError = true
      } else {
        setExpYearsError('')
      }

      const files = docsInputRef.current?.files
      if (!files || files.length === 0) {
        setExpDocsError('Please upload at least one supporting document (PDF/JPG/PNG, max 5MB)')
        hasError = true
      } else {
        // Validate file types and sizes
        const allowed = ['application/pdf', 'image/png', 'image/jpeg']
        let invalid = ''
        for (const f of Array.from(files)) {
          if (!allowed.includes(f.type) || f.size > 5 * 1024 * 1024) {
            invalid = 'Each document must be PDF/JPG/PNG and <= 5MB'
            break
          }
        }
        if (invalid) {
          setExpDocsError(invalid)
          hasError = true
        } else {
          setExpDocsError('')
        }
      }

      if (hasError) return
    }

    setIsLoading(true)
    setNameError('')

    try {
      const fd = new FormData()
      fd.append('first-name', firstName)
      fd.append('last-name', lastName)
      fd.append('email', email)
      fd.append('password', password)
      fd.append('role', role)
      if (role === 'expert') {
        if (professionalTitle) fd.append('professional-title', professionalTitle)
        if (licenseNumber) fd.append('license-number', licenseNumber)
        if (yearsOfExperience) fd.append('years-of-experience', yearsOfExperience)
        const files = docsInputRef.current?.files
        if (files && files.length) {
          Array.from(files).forEach(f => fd.append('documents', f))
        }
      }

      const res = await signup(fd)

      if (res?.success) {
        toast.success(AUTH_CONSTANTS.SUCCESS_MESSAGES.SIGNUP_SUCCESS)
        // Redirect to verify-email page with countdown before Sign In
        const emailParam = encodeURIComponent(email)
        const rt = returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''
        router.push(`/verify-email?email=${emailParam}${rt}`)
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
  function nextExpertStep() {
    // Ensure names and role are set before proceeding
    if (!firstName || !lastName) {
      setNameError(AUTH_CONSTANTS.ERROR_MESSAGES.NAME_REQUIRED)
      return
    }
    if (!role) {
      toast.error('Please select your role')
      return
    }
    setStep(3)
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

  useEffect(() => {
    if (isInviteFlow) {
      setRole('parent')
    }
  }, [isInviteFlow])

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
        ) : step === 2 ? (
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

                    {/* Role selection */}
                    <div className="mt-4">
                      {isInviteFlow ? (
                        <div className="rounded-lg border border-pink-100 bg-pink-50 px-3 py-2 text-sm text-pink-800">
                          You are joining via family invite. Your account will be created as <span className="font-semibold">Parent/Relative</span>.
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700 mb-2">I am a:</p>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="role"
                                checked={role === 'parent'}
                                onChange={() => setRole('parent')}
                              />
                              <span>Parent</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="role"
                                checked={role === 'expert'}
                                onChange={() => setRole('expert')}
                              />
                              <span>Expert</span>
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {role === 'expert' ? (
                    <div className="md:block hidden my-6 sm:my-8">
                      <AuthButton
                        onClick={nextExpertStep}
                        disabled={!firstName || !lastName}
                        className=""
                      >
                        Next
                      </AuthButton>
                    </div>
                  ) : (
                    <form
                      className="md:block hidden"
                      id="signupFormStep2"
                      onSubmit={handleSubmit}
                    >
                      <AuthButton
                        type="submit"
                        disabled={!firstName || !lastName || !role}
                        loading={isLoading}
                        loadingText="Creating account..."
                        className="my-6 sm:my-8"
                      >
                        Create Account
                      </AuthButton>
                    </form>
                  )}
                </div>

                <div>
                  <div className="py-4">
                    <p className="text-[#AAADB1] text-xs sm:text-sm">
                      By tapping &quot;Create Account&quot;, you agree to the
                      MamtaAi Terms of Use.
                    </p>
                    <button className="text-pink-600 hover:text-pink-700 font-bold text-xs sm:text-sm transition-colors">
                      Terms of Use
                    </button>
                  </div>
                  <div className="pb-4">
                    <p className="text-[#AAADB1] text-xs sm:text-sm">
                      To learn more about how MamtaAi collects, uses, shares, and
                      protects your personal data, please see the MamtaAi Privacy.
                    </p>
                    <button className="text-pink-600 hover:text-pink-700 font-bold text-xs sm:text-sm transition-colors">
                      Privacy Policy
                    </button>
                  </div>
                  {role === 'expert' ? (
                    <div className="md:hidden mb-4">
                      <AuthButton onClick={nextExpertStep} disabled={!firstName || !lastName} className="mt-6 sm:mt-12">
                        Next
                      </AuthButton>
                    </div>
                  ) : (
                    <form
                      className="md:hidden mb-4"
                      id="signupFormStep2"
                      onSubmit={handleSubmit}
                    >
                      <AuthButton
                        type="submit"
                        disabled={!firstName || !lastName || !role}
                        loading={isLoading}
                        loadingText="Creating account..."
                        className="mt-6 sm:mt-12"
                      >
                        Create Account
                      </AuthButton>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="step3">
            <div className="px-[24px] py-[10px]">
              <div className="py-[10px] max-w-[500px]">
                <AuthHeader
                  title="Expert verification"
                  label="SIGN UP"
                  onBack={() => setStep(2)}
                  returnUrl={returnUrl}
                />

                <div className="mt-[24px] space-y-3 ">
                  <AuthInput
                    placeholder="Professional Title"
                    value={professionalTitle}
                    onChange={e => {
                      setProfessionalTitle(e.target.value)
                      if (expTitleError) setExpTitleError('')
                    }}
                    onBlur={() => {
                      if (!professionalTitle.trim()) setExpTitleError('Professional title is required')
                    }}
                    error={expTitleError}
                  />
                  <AuthInput
                    placeholder="License Number"
                    value={licenseNumber}
                    onChange={e => {
                      setLicenseNumber(e.target.value)
                      if (expLicenseError) setExpLicenseError('')
                    }}
                    onBlur={() => {
                      if (!licenseNumber.trim()) setExpLicenseError('License number is required')
                    }}
                    error={expLicenseError}
                  />
                  <AuthInput
                    type="number"
                    min={0}
                    max={80}
                    step={1}
                    placeholder="Years of Experience"
                    value={yearsOfExperience}
                    onChange={e => {
                      setYearsOfExperience(e.target.value)
                      if (expYearsError) setExpYearsError('')
                    }}
                    onBlur={() => {
                      const n = Number(yearsOfExperience)
                      if (!yearsOfExperience || Number.isNaN(n) || n < 0 || n > 80 || !Number.isInteger(n)) {
                        setExpYearsError('Years of experience must be an integer between 0 and 80')
                      }
                    }}
                    error={expYearsError}
                  />
                  <div>
                    <label className="text-sm text-gray-700">Upload supporting documents</label>
                    <input
                      ref={docsInputRef}
                      type="file"
                      name="documents"
                      multiple
                      accept=".pdf,image/png,image/jpeg"
                      className="mt-1 block w-full text-sm"
                      onChange={() => expDocsError && setExpDocsError('')}
                    />
                    {expDocsError && (
                      <p className="text-xs text-red-600 mt-1">{expDocsError}</p>
                    )}
                  </div>
                  <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                    You will be given access after reviewing your application.
                  </p>
                </div>

                <form id="signupFormStep3" onSubmit={handleSubmit} className="md:block hidden">
                  <AuthButton
                    type="submit"
                    disabled={!firstName || !lastName || role !== 'expert'}
                    loading={isLoading}
                    loadingText="Creating account..."
                    className="my-6 sm:my-8"
                  >
                    Create Account
                  </AuthButton>
                </form>

                <form id="signupFormStep3m" onSubmit={handleSubmit} className="md:hidden mb-4">
                  <AuthButton
                    type="submit"
                    disabled={!firstName || !lastName || role !== 'expert'}
                    loading={isLoading}
                    loadingText="Creating account..."
                    className="mt-6 sm:mt-12"
                  >
                    Create Account
                  </AuthButton>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="px-[24px] py-[10px] md:px-0 md:py-0">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  )
}
