export const AUTH_CONSTANTS = {
  ROUTES: {
    WELCOME: '/welcome',
    SIGNIN: '/signin',
    SIGNUP: '/signup',
    FORGET_PASSWORD: '/forget-password',
  },
  STORAGE_KEYS: {
    AUTH_EMAIL: 'auth_email',
  },
  ERROR_MESSAGES: {
    EMAIL_INVALID: 'Enter a valid email address',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_INVALID: 'Password must meet all requirements',
    PASSWORDS_DONT_MATCH: "Passwords don't match",
    NAME_REQUIRED: 'First and last name are required',
  },
  SUCCESS_MESSAGES: {
    SIGNUP_SUCCESS: 'Account created successfully',
  },
} as const

export function buildReturnUrl(path: string, returnUrl?: string) {
  return returnUrl ? `${path}?returnUrl=${encodeURIComponent(returnUrl)}` : path
}

export function getBaseUrl() {
  return '/'
}


