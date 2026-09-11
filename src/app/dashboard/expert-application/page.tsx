'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft, FaCloudUploadAlt, FaUserMd } from 'react-icons/fa'
import Select from '@/components/ui/select'
import { toast } from '@/components/ui/sonner'
import Spinner from '@/components/ui/spinner'
import { formatReapplyCountdown } from '@/lib/expert/applications'

const SPECIALIZATIONS = [
  'Pediatrics',
  'Lactation / IBCLC',
  'Sleep consulting',
  'Nutrition / Dietetics',
  'Child psychology',
  'Neonatology',
  'General practice',
  'Other',
]

export default function ExpertApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [blocked, setBlocked] = useState<{ reason?: string; reapplyAt?: string | null } | null>(null)
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
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads/expert-document', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setForm(f => ({ ...f, documentUrl: data.url, documentName: data.name || file.name }))
      toast.success('Document uploaded')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.documentUrl) {
      toast.error('Please upload your license or certificate')
      return
    }
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
      toast.success('Application submitted! We will review your documents soon.')
      router.push('/onboarding?status=pending')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  if (blocked?.reason) {
    const countdown = blocked.reapplyAt ? formatReapplyCountdown(blocked.reapplyAt) : null
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50/80 p-8 text-center">
        <p className="font-semibold text-rose-900">{blocked.reason}</p>
        {countdown ? <p className="mt-2 text-sm text-rose-700">Re-apply in {countdown}</p> : null}
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/experts"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-pink-600 hover:text-pink-700"
      >
        <FaArrowLeft /> Back to experts
      </Link>

      <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100/30 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-600">
            <FaUserMd />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Become an expert</h1>
            <p className="text-sm text-gray-600">
              Submit your credentials for admin review. You keep full parent dashboard access while pending.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Specialization</label>
            <Select
              value={form.specialization}
              onChange={v => setForm(f => ({ ...f, specialization: v }))}
              placeholder="Select specialization"
              options={SPECIALIZATIONS.map(s => ({ value: s, label: s }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Professional title</label>
            <input
              required
              value={form.professionalTitle}
              onChange={e => setForm(f => ({ ...f, professionalTitle: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="e.g. Board-certified pediatrician"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">License / registration #</label>
              <input
                required
                value={form.licenseNumber}
                onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Years of experience</label>
              <input
                required
                type="number"
                min={0}
                max={80}
                value={form.yearsExperience}
                onChange={e => setForm(f => ({ ...f, yearsExperience: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="Brief background for reviewers and your future public profile."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Verification document <span className="text-rose-600">*</span>
            </label>
            <p className="mt-0.5 text-xs text-gray-500">Upload license, certificate, or registration (PDF or image, max 10MB).</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/40 px-4 py-8 hover:bg-pink-50/70">
              <FaCloudUploadAlt className="text-2xl text-pink-500" />
              <span className="mt-2 text-sm font-medium text-pink-700">
                {uploading ? 'Uploading…' : form.documentName || 'Choose file'}
              </span>
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) void uploadDocument(file)
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 py-3 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  )
}
