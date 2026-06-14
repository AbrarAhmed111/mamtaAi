'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import Spinner from '@/components/ui/spinner'
import Select from '@/components/ui/select'
import { useSubscription, usePlanLimit } from '@/hooks/useSubscription'
import Link from 'next/link'

export default function AddBabyPage() {
  const router = useRouter()
  const { slug, limitations } = useSubscription()
  const handlePlanLimit = usePlanLimit()
  const [adding, setAdding] = useState(false)
  const babyCap = limitations.max_babies_soft_cap ?? limitations.max_babies

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'' | 'male' | 'female'>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [heightCm, setHeightCm] = useState<string>('')
  const [bloodType, setBloodType] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [relationship, setRelationship] = useState<'' | 'mother' | 'father' | 'guardian' | 'caregiver' | 'grandparent' | 'other'>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false)

  const [formError, setFormError] = useState('')
  const [nameError, setNameError] = useState('')
  const [dobError, setDobError] = useState('')
  const [weightError, setWeightError] = useState('')
  const [heightError, setHeightError] = useState('')
  const [bloodError, setBloodError] = useState('')
  const [relationshipError, setRelationshipError] = useState('')
  const [avatarError, setAvatarError] = useState('')

  const validateName = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setNameError('Name is required')
      return false
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters')
      return false
    }
    if (trimmed.length > 50) {
      setNameError('Name must be 50 characters or fewer')
      return false
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
      setNameError('Name can only contain letters and basic punctuation')
      return false
    }
    setNameError('')
    return true
  }

  const validateDob = (value: string) => {
    if (!value) {
      setDobError('Birth date is required')
      return false
    }
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) {
      setDobError('Invalid birth date')
      return false
    }
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const oneYearMs = 365 * 24 * 60 * 60 * 1000
    if (diffMs < 0) {
      setDobError('Birth date cannot be in the future')
      return false
    }
    if (diffMs > oneYearMs) {
      setDobError('We currently support babies up to 12 months old')
      return false
    }
    setDobError('')
    return true
  }

  const validateWeight = (value: string) => {
    if (value === '') {
      setWeightError('')
      return true
    }
    const n = Number(value)
    if (Number.isNaN(n) || n < 0.45 || n > 20) {
      setWeightError('Weight must be between 0.45 and 20 kg')
      return false
    }
    setWeightError('')
    return true
  }

  const validateHeight = (value: string) => {
    if (value === '') {
      setHeightError('')
      return true
    }
    const n = Number(value)
    if (Number.isNaN(n) || n < 20 || n > 80) {
      setHeightError('Height must be between 20 and 80 cm')
      return false
    }
    setHeightError('')
    return true
  }

  const validateBloodType = (value: string) => {
    if (!value) {
      setBloodError('')
      return true
    }
    if (!['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(value)) {
      setBloodError('Invalid blood type')
      return false
    }
    setBloodError('')
    return true
  }

  const validateRelationship = (value: string) => {
    if (!value) {
      setRelationshipError('Please select your relationship')
      return false
    }
    setRelationshipError('')
    return true
  }

  const validateAvatarFile = (file: File | null) => {
    if (!file) {
      setAvatarError('')
      return true
    }
    if (!file.type.startsWith('image/')) {
      setAvatarError('Avatar must be an image file')
      return false
    }
    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      setAvatarError('Avatar image must be 5MB or smaller')
      return false
    }
    setAvatarError('')
    return true
  }

  const validateAvatarUrl = (value: string) => {
    if (!value.trim()) {
      setAvatarError('')
      return true
    }
    try {
      const u = new URL(value.trim())
      if (!['http:', 'https:'].includes(u.protocol)) {
        setAvatarError('Avatar URL must be http or https')
        return false
      }
      setAvatarError('')
      return true
    } catch {
      setAvatarError('Invalid avatar URL')
      return false
    }
  }

  const submit = async () => {
    setFormError('')
    const okName = validateName(name)
    const okDob = validateDob(birthDate)
    const okRelationship = validateRelationship(relationship)
    const okWeight = validateWeight(weightKg)
    const okHeight = validateHeight(heightCm)
    const okBlood = validateBloodType(bloodType)
    const okAvatarFile = validateAvatarFile(avatarFile)
    const okAvatarUrl = validateAvatarUrl(avatarUrl)
    if (!okName || !okDob || !okRelationship || !okWeight || !okHeight || !okBlood || !okAvatarFile || !okAvatarUrl) {
      return
    }
    if (notes.length > 500) {
      setFormError('Medical notes must be 500 characters or fewer')
      return
    }

    try {
      setAdding(true)

      // Optional avatar handling: upload file if provided, else validate URL if provided
      let finalAvatarUrl: string | undefined = undefined
      if (avatarFile) {
        try {
          setAvatarUploading(true)
          const fd = new FormData()
          fd.append('file', avatarFile)
          const res = await fetch('/api/uploads/baby-avatar', { method: 'POST', body: fd })
          const json = await res.json().catch(() => ({}))
          if (!res.ok) {
            setAvatarError(json?.error || 'Failed to upload avatar')
            setAdding(false)
            setAvatarUploading(false)
            return
          }
          finalAvatarUrl = json?.url
          setAvatarUploading(false)
        } catch {
          setAvatarError('Failed to upload avatar')
          setAdding(false)
          setAvatarUploading(false)
          return
        }
      } else if (avatarUrl.trim()) {
        try {
          const u = new URL(avatarUrl.trim())
          finalAvatarUrl = u.toString()
        } catch {
          setAvatarError('Invalid avatar URL')
          setAdding(false)
          return
        }
      }

      const res = await fetch('/api/babies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          birth_date: birthDate,
          gender: gender || undefined,
          birth_weight_kg: weightKg !== '' ? Number(weightKg) : undefined,
          birth_height_cm: heightCm !== '' ? Number(heightCm) : undefined,
          blood_type: bloodType || undefined,
          medical_notes: notes || undefined,
          relationship,
          avatar_url: finalAvatarUrl,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (handlePlanLimit(data)) return
        setFormError(data.message || data?.error || 'Failed to add baby')
        return
      }
      toast.success('Baby added successfully')
      router.replace('/dashboard/babies')
    } catch (e: any) {
      setFormError('Failed to add baby')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Page hero */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <h1 className="text-2xl font-bold text-gray-900">Add Baby</h1>
        <p className="text-gray-600 mt-1">Provide your baby&apos;s details in the sections below.</p>
        {babyCap != null && (
          <p className="text-sm text-gray-600 mt-2">
            Your {slug} plan allows up to {babyCap} baby{babyCap === 1 ? '' : ' profiles'}.{' '}
            <Link href="/pricing" className="text-pink-600 hover:underline font-medium">
              Upgrade
            </Link>
          </p>
        )}
        {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
      </section>

      {/* Section: Basic Information */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Name <span className="text-red-600">*</span></label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (nameError) setNameError('')
              }}
              onBlur={() => {
                validateName(name)
              }}
              placeholder="e.g., Ayaan"
            />
            {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Birth Date <span className="text-red-600">*</span></label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={birthDate}
              onChange={e => {
                setBirthDate(e.target.value)
                if (dobError) setDobError('')
              }}
              onBlur={() => validateDob(birthDate)}
            />
            {dobError && <p className="text-xs text-red-600 mt-1">{dobError}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Gender</label>
            <Select
              value={gender}
              onChange={v => setGender(v as typeof gender)}
              options={[
                { value: '', label: 'Select gender (optional)' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              aria-label="Gender"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Avatar</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  onChange={e => {
                    const f = e.target.files?.[0] || null
                    setAvatarFile(f || null)
                    validateAvatarFile(f || null)
                    if (f) {
                      try {
                        const url = URL.createObjectURL(f)
                        setAvatarPreview(url)
                      } catch {
                        // ignore preview failure
                      }
                    } else {
                      setAvatarPreview('')
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Upload an image (optional). Max ~5MB recommended.</p>
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Or paste an avatar URL"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={avatarUrl}
                  onChange={e => {
                    setAvatarUrl(e.target.value)
                    const val = e.target.value.trim()
                    if (val) {
                      try {
                        const u = new URL(val)
                        setAvatarPreview(u.toString())
                      } catch {
                        // ignore until blur/submit
                      }
                    } else {
                      setAvatarPreview('')
                    }
                  }}
                  onBlur={() => validateAvatarUrl(avatarUrl)}
                />
              </div>
            </div>
            {(avatarPreview || avatarUploading) && (
              <div className="mt-3 flex items-center gap-3">
                {avatarPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover border"
                  />
                )}
                {avatarUploading && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Spinner size={18} />
                    <span className="text-sm">Uploading avatar...</span>
                  </div>
                )}
              </div>
            )}
            {avatarError && <p className="text-xs text-red-600 mt-1">{avatarError}</p>}
          </div>
        </div>
      </section>

      {/* Section: Relationship */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Relationship</h2>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Your relationship to the baby <span className="text-red-600">*</span></label>
          <Select
            value={relationship}
            onChange={v => {
              setRelationship(v as typeof relationship)
              if (relationshipError) setRelationshipError('')
            }}
            onBlur={() => validateRelationship(relationship)}
            options={[
              { value: '', label: 'Select relationship' },
              { value: 'mother', label: 'Mother' },
              { value: 'father', label: 'Father' },
              { value: 'guardian', label: 'Guardian' },
              { value: 'caregiver', label: 'Caregiver' },
              { value: 'grandparent', label: 'Grandparent' },
              { value: 'other', label: 'Other' },
            ]}
            required
            aria-label="Your relationship to the baby"
          />
          {relationshipError && <p className="text-xs text-red-600 mt-1">{relationshipError}</p>}
        </div>
      </section>

      {/* Section: Measurements */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Measurements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Birth Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.45"
              max="20"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={weightKg}
              onChange={e => {
                setWeightKg(e.target.value)
                if (weightError) setWeightError('')
              }}
              onBlur={() => {
                validateWeight(weightKg)
              }}
              placeholder="e.g., 3.2"
            />
            {weightError && <p className="text-xs text-red-600 mt-1">{weightError}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Birth Height (cm)</label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="80"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={heightCm}
              onChange={e => {
                setHeightCm(e.target.value)
                if (heightError) setHeightError('')
              }}
              onBlur={() => {
                validateHeight(heightCm)
              }}
              placeholder="e.g., 50"
            />
            {heightError && <p className="text-xs text-red-600 mt-1">{heightError}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Blood Type</label>
            <Select
              value={bloodType}
              onChange={v => {
                setBloodType(v)
                if (bloodError) setBloodError('')
              }}
              onBlur={() => validateBloodType(bloodType)}
              options={[
                { value: '', label: 'Select blood type (optional)' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
              aria-label="Blood type"
            />
            {bloodError && <p className="text-xs text-red-600 mt-1">{bloodError}</p>}
          </div>
        </div>
      </section>

      {/* Section: Medical Notes */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Notes</h2>
        <label className="block text-sm text-gray-700 mb-1">Notes</label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes (max 500 chars)"
        />
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
          disabled={adding}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
          disabled={adding}
        >
          {adding ? 'Adding...' : 'Add Baby'}
        </button>
      </div>
    </div>
  )
}


