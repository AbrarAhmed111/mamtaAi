import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { IoMdArrowRoundBack } from 'react-icons/io'

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
  const backIconClass =
    'cursor-pointer text-pink-600 transition-colors hover:text-pink-700 shrink-0'

  return (
    <div className="min-w-0">
      <div className="flex w-full min-w-0 items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            aria-label="Go back"
            className="inline-flex shrink-0 items-center justify-center rounded-lg p-1 -ml-1"
            onClick={onBack}
          >
            <IoMdArrowRoundBack size={24} className={backIconClass} />
          </button>
        ) : backHref ? (
          <Link
            href={
              returnUrl
                ? `${backHref}?returnUrl=${encodeURIComponent(returnUrl)}`
                : backHref
            }
            className="inline-flex shrink-0 items-center justify-center rounded-lg p-1 -ml-1"
            aria-label="Go back"
          >
            <IoMdArrowRoundBack size={24} className={backIconClass} />
          </Link>
        ) : (
          <span className="w-8 shrink-0" aria-hidden />
        )}

        {label ? (
          <span
            className={`ml-auto shrink-0 text-xs font-semibold uppercase tracking-wide bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent sm:text-sm ${poppins.className}`}
          >
            {label}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-2 sm:mt-5 sm:gap-3">
        <h1
          className={`${poppins.className} text-xl font-bold leading-tight bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent sm:text-2xl lg:text-3xl`}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}
