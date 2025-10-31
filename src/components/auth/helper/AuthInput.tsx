import React, { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BsFillEyeFill, BsFillEyeSlashFill } from 'react-icons/bs'

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  showPasswordToggle?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      error,
      showPasswordToggle,
      showPassword,
      onTogglePassword,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            className={`bg-[#F6F7F8] px-4 text-[16px] font-medium rounded-2xl min-h-[56px] py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              showPasswordToggle ? 'pr-10' : ''
            } ${className || ''}`}
            {...props}
          />

          {showPasswordToggle && (
            <div
              className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-500 text-xl font-extrabold"
              onClick={onTogglePassword}
            >
              {showPassword ? (
                <BsFillEyeSlashFill size={20} />
              ) : (
                <BsFillEyeFill size={20} />
              )}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="input-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="text-red-500 text-xs mt-2"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  },
)

AuthInput.displayName = 'AuthInput'

export default AuthInput
