// Email validation utilities
export const validateEmail = (
  email: string,
): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Enter a valid email address' }
  }

  return { isValid: true }
}

// Live email validation (no error if empty, only validates format)
export const validateEmailLive = (email: string): boolean => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation utilities
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  specialChars: /[!@#$%^&*]/,
  upperCase: /[A-Z]/,
  lowerCase: /[a-z]/,
  numbers: /\d/,
} as const

export interface PasswordValidationResult {
  hasMinLength: boolean
  hasSpecialChar: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumber: boolean
  isValid: boolean
}

export const validatePassword = (
  password: string,
): PasswordValidationResult => {
  const hasMinLength = password.length >= PASSWORD_REQUIREMENTS.minLength
  const hasSpecialChar = PASSWORD_REQUIREMENTS.specialChars.test(password)
  const hasUpperCase = PASSWORD_REQUIREMENTS.upperCase.test(password)
  const hasLowerCase = PASSWORD_REQUIREMENTS.lowerCase.test(password)
  const hasNumber = PASSWORD_REQUIREMENTS.numbers.test(password)

  return {
    hasMinLength,
    hasSpecialChar,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    isValid:
      hasMinLength &&
      hasSpecialChar &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber,
  }
}

// Simple password validation for form checks
export const isValidPassword = (password: string): boolean => {
  return validatePassword(password).isValid
}
