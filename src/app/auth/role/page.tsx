'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaBaby, FaUserMd } from 'react-icons/fa'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthButton from '@/components/auth/AuthButton'

export default function RoleSelectionPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chooseRole = async (role: 'parent' | 'expert') => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to set role')
      }
      if (role === 'parent') {
        router.replace('/dashboard')
      } else {
        router.replace('/auth/expert-application')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to continue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-[24px] py-[10px] max-w-full lg:max-w-[500px]">
      <AuthHeader
        title="Tell us about you"
        subtitle="Choose the role that best describes you. Healthcare professionals must submit credentials and a verification document."
        label="SIGN UP"
        onBack={() => router.replace('/welcome')}
      />

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void chooseRole('parent')}
          className="w-full rounded-2xl border-2 border-pink-100 bg-white p-5 text-left transition hover:border-pink-300 hover:bg-pink-50/50 disabled:opacity-60"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
              <FaBaby />
            </span>
            <div>
              <div className="font-semibold text-gray-900">Parent</div>
              <div className="mt-1 text-sm text-gray-600">
                Track cries, manage babies, and use MamtaAI as a caregiver.
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => void chooseRole('expert')}
          className="w-full rounded-2xl border-2 border-pink-100 bg-white p-5 text-left transition hover:border-pink-300 hover:bg-pink-50/50 disabled:opacity-60"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <FaUserMd />
            </span>
            <div>
              <div className="font-semibold text-gray-900">Expert</div>
              <div className="mt-1 text-sm text-gray-600">
                Apply with license and documents. Verification required before expert access.
              </div>
            </div>
          </div>
        </button>
      </div>

      {submitting ? (
        <p className="mt-4 text-center text-sm text-gray-500">Please wait…</p>
      ) : null}

      <AuthButton
        className="mt-6"
        variant="secondary"
        onClick={() => router.replace('/welcome')}
        disabled={submitting}
      >
        Back
      </AuthButton>
    </div>
  )
}
