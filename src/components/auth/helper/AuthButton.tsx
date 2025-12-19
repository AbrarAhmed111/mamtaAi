import React from 'react'

interface AuthButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

export default function AuthButton({
  loading = false,
  loadingText = 'Loading...',
  variant = 'primary',
  children,
  disabled,
  className,
  ...props
}: AuthButtonProps) {
  const baseClasses =
    'rounded-2xl min-h-[46px] md:min-h-[56px] font-semibold py-2.5 sm:py-3 text-sm sm:text-[16px] w-full transition-colors duration-300'

  const variantClasses = {
    primary:
      disabled || loading
        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    secondary:
      'border-2 border-pink-300 text-pink-600 bg-transparent hover:bg-pink-50 hover:border-pink-400',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  )
}
