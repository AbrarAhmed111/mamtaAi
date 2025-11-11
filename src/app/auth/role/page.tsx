'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
        router.replace('/auth/expert-onboarding')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to continue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Tell us about you</h1>
        <p className="text-gray-600 mt-2 text-center">Choose the role that best describes you.</p>

        {error && (
          <div className="mt-4 text-sm text-red-600 text-center">{error}</div>
        )}

        <div className="mt-6 grid gap-4">
          <button
            disabled={submitting}
            onClick={() => chooseRole('parent')}
            className="w-full p-5 border-2 rounded-xl hover:border-gray-300 transition disabled:opacity-50 text-left"
          >
            <div className="font-semibold text-gray-900">Parent</div>
            <div className="text-gray-600 text-sm">Access the dashboard and features for parents.</div>
          </button>

          <button
            disabled={submitting}
            onClick={() => chooseRole('expert')}
            className="w-full p-5 border-2 rounded-xl hover:border-gray-300 transition disabled:opacity-50 text-left"
          >
            <div className="font-semibold text-gray-900">Expert</div>
            <div className="text-gray-600 text-sm">Provide professional guidance. Verification required.</div>
          </button>
        </div>

        <AuthButton
          className="mt-6"
          onClick={() => router.replace('/welcome')}
          variant="secondary"
        >
          Back
        </AuthButton>
      </div>
    </div>
  )
}


