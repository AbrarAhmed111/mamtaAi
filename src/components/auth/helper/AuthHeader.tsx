import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { IoMdArrowRoundBack } from "react-icons/io";
const BackIcon = '/icons/Auth-Back.svg'
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700', '400'],
})

interface AuthHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  label?: string
  onBack?: () => void
  returnUrl?: string
}

export default function AuthHeader({
  title,
  subtitle,
  backHref = '/welcome',
  label,
  onBack,
  returnUrl,
}: AuthHeaderProps) {
  const BackButton = () => (
    <IoMdArrowRoundBack
      size={24}
      className="cursor-pointer text-pink-600 hover:text-pink-700 transition-colors"
      onClick={onBack}
    />
  )

  return (
    <div>
      {/* Header with back button and label */}
      <div className="flex items-center justify-between w-full">
        {backHref ? (
          <Link
            href={
              returnUrl
                ? `${backHref}?returnUrl=${encodeURIComponent(returnUrl)}`
                : backHref
            }
            className="sm:flex-none"
          >
            <BackButton />
          </Link>
        ) : (
          <div className="sm:flex-none" onClick={onBack}>
            <BackButton />
          </div>
        )}

        {label && (
          <div className="flex-auto flex justify-center md:justify-end">
            <span
              className={`text-sm leading-[28px] bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-semibold auth-signup-text ${poppins.className}`}
            >
              {label}
            </span>
          </div>
        )}
      </div>

      {/* Title and subtitle */}
      <div className="flex flex-col gap-3 mt-[24px]">
        <div className="flex items-center gap-1 text-lg sm:text-3xl font-bold">
          <h1
            className={`${poppins.className} text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent`}
          >
            {title}
          </h1>
        </div>
        {subtitle && (
          <span className="text-gray-600 font-medium leading-[150%] tracking-[-0.5px] text-[16px] lg:text-lg xl:text-[22px]">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
