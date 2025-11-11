'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthButton from '@/components/auth/AuthButton'

export default function ExpertOnboardingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    professionalTitle: '',
    licenseNumber: '',
    yearsOfExperience: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to submit details')
      }
      router.replace('/onboarding?status=pending')
    } catch (e: any) {
      setError(e?.message || 'Failed to submit details')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Expert verification</h1>
        <p className="text-gray-600 mt-2 text-center">Provide your professional details for review.</p>

        {error && <div className="mt-4 text-sm text-red-600 text-center">{error}</div>}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Professional Title</label>
            <input
              name="professionalTitle"
              value={form.professionalTitle}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="e.g., Pediatrician"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">License Number</label>
            <input
              name="licenseNumber"
              value={form.licenseNumber}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Your professional license"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
            <input
              name="yearsOfExperience"
              value={form.yearsOfExperience}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="e.g., 5"
              required
            />
          </div>

          <AuthButton type="submit" loading={submitting} loadingText="Submitting..." className="mt-4">
            Submit for Review
          </AuthButton>
          <AuthButton
            type="button"
            variant="secondary"
            className="!mt-2"
            onClick={() => router.replace('/auth/role')}
          >
            Back
          </AuthButton>
        </form>
      </div>
    </div>
  )
}


