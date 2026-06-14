'use client'

import { useAuth } from '@/lib/supabase/context'
import Link from 'next/link'

export default function AccountSuspendedPage() {
  const { user, signOut, loading } = useAuth()
  const meta = (user?.profile?.metadata as Record<string, unknown>) || {}
  const reason =
    (typeof meta.suspension_reason === 'string' && meta.suspension_reason) ||
    'Your account has been suspended by an administrator.'

  return (
    <div className="min-h-screen bg-[#fdf4f6] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-8 shadow-lg shadow-rose-100/40 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-2xl font-bold">
          !
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Account access restricted</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          Contact support — you don&apos;t have access to MamtaAI at this time.
        </p>
        <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50/80 p-4 text-left text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Details</p>
          <p className="mt-2">{loading ? 'Loading…' : reason}</p>
          {user?.email && (
            <p className="mt-2 text-gray-500">Account: {user.email}</p>
          )}
        </div>
        <p className="mt-5 text-sm text-gray-500">
          If you believe this is a mistake, email{' '}
          <a href="mailto:support@mamtaai.com" className="text-pink-600 hover:underline">
            support@mamtaai.com
          </a>
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={async () => {
              await signOut()
              window.location.href = '/welcome'
            }}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
          <Link
            href="mailto:support@mamtaai.com"
            className="rounded-xl bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}
