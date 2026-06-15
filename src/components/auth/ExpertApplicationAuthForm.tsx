'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaCloudUploadAlt } from 'react-icons/fa'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'
import Spinner from '@/components/ui/spinner'
import { formatReapplyCountdown } from '@/lib/expert/applications'

export const EXPERT_SPECIALIZATIONS = [
  'Pediatrics',
  'Lactation / IBCLC',
  'Sleep consulting',
  'Nutrition / Dietetics',
  'Child psychology',
  'Neonatology',
  'General practice',
  'Other',
] as const

type ExpertApplicationAuthFormProps = {
  onBack: () => void
  afterSubmitPath?: string
}

export default function ExpertApplicationAuthForm({
  onBack,
  afterSubmitPath = '/onboarding?status=pending',
}: ExpertApplicationAuthFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [blocked, setBlocked] = useState<{ reason?: string; reapplyAt?: string | null } | null>(null)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    specialization: '',
    professionalTitle: '',
    licenseNumber: '',
    yearsExperience: '',
    bio: '',
    documentUrl: '',
    documentName: '',
  })

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/experts/apply', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (data.status === 'approved') {
          router.replace('/dashboard')
          return
        }
        if (data.status === 'pending') {
          router.replace('/onboarding?status=pending')
          return
        }
        if (!data.canApply) {
          setBlocked({ reason: data.applyBlockedReason, reapplyAt: data.reapplyAt })
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const uploadDocument = async (file: File) => {
    setUploading(true)
    setFormError('')
    try {
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
      if (!allowed.includes(file.type)) {
        setFieldErrors(prev => ({
          ...prev,
          document: 'File must be PDF, JPEG, PNG, or WebP',
        }))
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, document: 'File must be under 10MB' }))
        return
      }

      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads/expert-document', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setForm(f => ({ ...f, documentUrl: data.url, documentName: data.name || file.name }))
      setFieldErrors(prev => ({ ...prev, document: '' }))
    } catch (e: unknown) {
      setFieldErrors(prev => ({
        ...prev,
        document: e instanceof Error ? e.message : 'Upload failed',
      }))
    } finally {
      setUploading(false)
    }
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.specialization.trim()) next.specialization = 'Select your specialization'
    if (!form.professionalTitle.trim()) next.professionalTitle = 'Professional title is required'
    if (!form.licenseNumber.trim()) next.licenseNumber = 'License number is required'
    const years = Number(form.yearsExperience)
    if (!form.yearsExperience || !Number.isFinite(years) || years < 0 || years > 80) {
      next.yearsExperience = 'Enter valid years of experience (0–80)'
    }
    if (!form.documentUrl) {
      next.document = 'Upload your license, certificate, or registration document'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/experts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialization: form.specialization,
          professionalTitle: form.professionalTitle,
          licenseNumber: form.licenseNumber,
          yearsExperience: Number(form.yearsExperience),
          bio: form.bio,
          documentUrl: form.documentUrl,
          documentName: form.documentName,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      router.replace(afterSubmitPath)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    )
  }

  if (blocked?.reason) {
    const countdown = blocked.reapplyAt ? formatReapplyCountdown(blocked.reapplyAt) : null
    return (
      <div className="w-full min-w-0 py-2">
        <AuthHeader
          title="Application not available"
          label="EXPERT"
          onBack={() => router.replace('/dashboard')}
        />
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-5">
          <p className="font-semibold text-rose-900">{blocked.reason}</p>
          {countdown ? <p className="mt-2 text-sm text-rose-700">Re-apply in {countdown}</p> : null}
        </div>
        <AuthButton className="mt-6" onClick={() => router.replace('/dashboard')}>
          Go to dashboard
        </AuthButton>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 py-2">
      <AuthHeader
        title="Expert verification"
        subtitle="Submit your credentials and a verification document. You keep full parent dashboard access while we review your application."
        label="EXPERT"
        onBack={onBack}
      />

      {formError ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {formError}
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-5 space-y-4 sm:mt-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Specialization</label>
          <select
            required
            value={form.specialization}
            onChange={e => {
              setForm(f => ({ ...f, specialization: e.target.value }))
              if (fieldErrors.specialization) {
                setFieldErrors(prev => ({ ...prev, specialization: '' }))
              }
            }}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-4 py-3 text-[16px] font-medium focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <option value="">Select specialization</option>
            {EXPERT_SPECIALIZATIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {fieldErrors.specialization ? (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.specialization}</p>
          ) : null}
        </div>

        <AuthInput
          placeholder="Professional title"
          value={form.professionalTitle}
          onChange={e => {
            setForm(f => ({ ...f, professionalTitle: e.target.value }))
            if (fieldErrors.professionalTitle) {
              setFieldErrors(prev => ({ ...prev, professionalTitle: '' }))
            }
          }}
          error={fieldErrors.professionalTitle}
        />

        <AuthInput
          placeholder="License / registration number"
          value={form.licenseNumber}
          onChange={e => {
            setForm(f => ({ ...f, licenseNumber: e.target.value }))
            if (fieldErrors.licenseNumber) {
              setFieldErrors(prev => ({ ...prev, licenseNumber: '' }))
            }
          }}
          error={fieldErrors.licenseNumber}
        />

        <AuthInput
          type="number"
          min={0}
          max={80}
          placeholder="Years of experience"
          value={form.yearsExperience}
          onChange={e => {
            setForm(f => ({ ...f, yearsExperience: e.target.value }))
            if (fieldErrors.yearsExperience) {
              setFieldErrors(prev => ({ ...prev, yearsExperience: '' }))
            }
          }}
          error={fieldErrors.yearsExperience}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio (optional)</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            placeholder="Brief background for reviewers"
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-4 py-3 text-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Verification document <span className="text-rose-600">*</span>
          </label>
          <p className="mb-2 text-xs text-gray-500">
            Upload license, certificate, or registration (PDF or image, max 10MB).
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/40 px-4 py-8 transition hover:bg-pink-50/70">
            <FaCloudUploadAlt className="text-2xl text-pink-500" />
            <span className="mt-2 text-center text-sm font-medium text-pink-700">
              {uploading ? 'Uploading…' : form.documentName || 'Choose file'}
            </span>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading || submitting}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) void uploadDocument(file)
              }}
            />
          </label>
          {fieldErrors.document ? (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.document}</p>
          ) : null}
        </div>

        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Typical review time is 1–3 business days. You will be notified once approved.
        </p>

        <AuthButton
          type="submit"
          loading={submitting}
          loadingText="Submitting..."
          disabled={uploading}
          className="mt-2"
        >
          Submit for review
        </AuthButton>
        <AuthButton type="button" variant="secondary" onClick={onBack}>
          Back
        </AuthButton>
      </form>
    </div>
  )
}
