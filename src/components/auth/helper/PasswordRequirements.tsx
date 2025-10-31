import { IoIosCheckmarkCircle, IoIosCloseCircle } from 'react-icons/io'
import { validatePassword } from '@/lib/validations'

interface PasswordRequirementsProps {
  password: string
  isVisible?: boolean
  showPlaceholder?: boolean
  iconSize?: number
  textSize?: string
}

export default function PasswordRequirements({
  password,
  isVisible = true,
  showPlaceholder = false,
  iconSize = 16,
  textSize = 'text-sm',
}: PasswordRequirementsProps) {
  const requirements = validatePassword(password)

  const requirementsList = [
    {
      key: 'minLength',
      text: 'Has at least 8 characters',
      valid: requirements.hasMinLength,
    },
    {
      key: 'specialChar',
      text: 'Has special characters (!@#$%^&*)',
      valid: requirements.hasSpecialChar,
    },
    {
      key: 'upperCase',
      text: 'Has at least one uppercase letter',
      valid: requirements.hasUpperCase,
    },
    {
      key: 'lowerCase',
      text: 'Has at least one lowercase letter',
      valid: requirements.hasLowerCase,
    },
    {
      key: 'number',
      text: 'Has at least one number',
      valid: requirements.hasNumber,
    },
  ]

  const shouldShowRequirements = password || showPlaceholder

  return (
    <div
      className={`${
        isVisible && shouldShowRequirements
          ? 'max-h-[300px] opacity-100'
          : 'max-h-0 opacity-0'
      } transition-all duration-500 ease-in-out overflow-hidden`}
    >
      <div className="py-4 space-y-2">
        {requirementsList.map(({ key, text, valid }) => (
          <div key={key} className="flex items-center gap-2">
            {password ? (
              valid ? (
                <IoIosCheckmarkCircle
                  className="text-green-500"
                  size={iconSize}
                />
              ) : (
                <IoIosCloseCircle className="text-red-500" size={iconSize} />
              )
            ) : (
              <span className="text-[#909090] w-5 h-5 flex items-center justify-center rounded-full">
                •
              </span>
            )}
            <p
              className={`${textSize} ${password ? 'text-slate-500 sm:text-[16px]' : 'text-[#909090] sm:text-[16px]'}`}
            >
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
