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
        ? 'bg-[#E0E6EE] text-[#66696D] cursor-not-allowed'
        : 'bg-[#002e6b] text-white hover:opacity-90',
    secondary:
      'border border-[#002e6b] text-[#002e6b] bg-transparent hover:bg-[#002e6b] hover:text-white',
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
