'use client'

import Link from 'next/link'
import { FaUserShield } from 'react-icons/fa'

export default function AdminHeaderBadge() {
  return (
    <div className="relative shrink-0 group">
      <div
        tabIndex={0}
        className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-purple-200 bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-purple-900 outline-none transition-colors hover:from-purple-100 hover:via-violet-100 hover:to-purple-100 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
        aria-describedby="admin-header-tooltip"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700">
          <FaUserShield className="h-2.5 w-2.5" aria-hidden />
        </span>
        Admin
      </div>

      <div className="invisible absolute right-0 top-full z-[60] translate-y-1 pt-2 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div
          id="admin-header-tooltip"
          role="tooltip"
          className="w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-purple-100 bg-white p-4 shadow-xl"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
            Administrator
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
            Full platform access including user management, moderation, and admin overview.
          </p>
          <p className="mt-3 text-xs">
            <Link
              href="/dashboard/admin"
              className="font-semibold text-purple-700 hover:underline"
            >
              Open admin overview →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
