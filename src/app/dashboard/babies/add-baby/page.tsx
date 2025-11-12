'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import Spinner from '@/components/ui/spinner'

export default function AddBabyPage() {
  const router = useRouter()
  const [adding, setAdding] = useState(false)

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

  const submit = async () => {
    setFormError('')
    if (!name.trim()) setNameError('Name is required')
    if (!relationship) setRelationshipError('Please select your relationship')
    const okDob = validateDob(birthDate)
    if (!name.trim() || !relationship || !okDob || nameError || dobError || weightError || heightError || bloodError || relationshipError) return

    if (weightKg !== '') {
      const n = Number(weightKg)
      if (Number.isNaN(n) || n < 0 || n > 20) {
        setWeightError('Weight must be between 0 and 20 kg')
        return
      }
    }
    if (heightCm !== '') {
      const n = Number(heightCm)
      if (Number.isNaN(n) || n < 20 || n > 80) {
        setHeightError('Height must be between 20 and 80 cm')
        return
      }
    }
    if (bloodType && !['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(bloodType)) {
      setBloodError('Invalid blood type')
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
        setFormError(data?.error || 'Failed to add baby')
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
                if (!name.trim()) setNameError('Name is required')
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
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={gender}
              onChange={e => setGender(e.target.value as any)}
            >
              <option value="">Select gender (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
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
                    setAvatarError('')
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
                    setAvatarError('')
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
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={relationship}
            onChange={e => {
              setRelationship(e.target.value as any)
              if (relationshipError) setRelationshipError('')
            }}
            onBlur={() => {
              if (!relationship) setRelationshipError('Please select your relationship')
            }}
          >
            <option value="">Select relationship</option>
            <option value="mother">Mother</option>
            <option value="father">Father</option>
            <option value="guardian">Guardian</option>
            <option value="caregiver">Caregiver</option>
            <option value="grandparent">Grandparent</option>
            <option value="other">Other</option>
          </select>
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
              min="0"
              max="20"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={weightKg}
              onChange={e => {
                setWeightKg(e.target.value)
                if (weightError) setWeightError('')
              }}
              onBlur={() => {
                if (weightKg !== '') {
                  const n = Number(weightKg)
                  if (Number.isNaN(n) || n < 0 || n > 20) {
                    setWeightError('Weight must be between 0 and 20 kg')
                  }
                }
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
                if (heightCm !== '') {
                  const n = Number(heightCm)
                  if (Number.isNaN(n) || n < 20 || n > 80) {
                    setHeightError('Height must be between 20 and 80 cm')
                  }
                }
              }}
              placeholder="e.g., 50"
            />
            {heightError && <p className="text-xs text-red-600 mt-1">{heightError}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Blood Type</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={bloodType}
              onChange={e => {
                setBloodType(e.target.value)
                if (bloodError) setBloodError('')
              }}
              onBlur={() => {
                if (bloodType && !['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(bloodType)) {
                  setBloodError('Invalid blood type')
                }
              }}
            >
              <option value="">Select blood type (optional)</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
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


