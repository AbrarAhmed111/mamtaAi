'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Spinner from '@/components/ui/spinner'
import { toast } from '@/components/ui/sonner'
import RecordingSection from '@/components/Dashboard/RecordingSection'
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa'

export default function BabyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const babyId = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [baby, setBaby] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'' | 'male' | 'female'>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [heightCm, setHeightCm] = useState<string>('')
  const [bloodType, setBloodType] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [selectedBaby, setSelectedBaby] = useState<{ id: string; name: string; avatar: string } | null>(null)

  const age = useMemo(() => formatAge(birthDate), [birthDate])
  const avatar = baby?.avatar_url || '/api/placeholder/256/256'

  useEffect(() => {
    const load = async () => {
      if (!babyId) return
      try {
        setLoading(true)
        const res = await fetch(`/api/babies/${babyId}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error(data?.error || 'Failed to load baby')
          return
        }
        setBaby(data.baby)
        setName(data.baby.name || '')
        setBirthDate(data.baby.birth_date || '')
        setGender((data.baby.gender || '') as any)
        setWeightKg(data.baby.birth_weight_kg != null ? String(data.baby.birth_weight_kg) : '')
        setHeightCm(data.baby.birth_height_cm != null ? String(data.baby.birth_height_cm) : '')
        setBloodType(data.baby.blood_type || '')
        setNotes(data.baby.medical_notes || '')
        // Set selected baby for recording component
        setSelectedBaby({
          id: data.baby.id,
          name: data.baby.name,
          avatar: data.baby.avatar_url || '/api/placeholder/96/96'
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [babyId])

  const save = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/babies/${babyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          birth_date: birthDate,
          gender: gender || null,
          birth_weight_kg: weightKg !== '' ? Number(weightKg) : null,
          birth_height_cm: heightCm !== '' ? Number(heightCm) : null,
          blood_type: bloodType || null,
          medical_notes: notes || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to save')
        return
      }
      toast.success('Saved changes')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRecording = async (blob: Blob, durationSeconds: number) => {
    if (!babyId) {
      toast.error('Baby ID not found')
      return
    }
    try {
      const fd = new FormData()
      fd.append('file', blob, `recording_${Date.now()}.webm`)
      fd.append('baby_id', babyId)
      fd.append('duration_seconds', String(durationSeconds || 0))
      const res = await fetch('/api/recordings', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error || 'Failed to save recording')
        return
      }
      toast.success('Recording saved successfully')
    } catch (error) {
      toast.error('Failed to save recording')
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    try {
      setDeleting(true)
      const res = await fetch(`/api/babies/${babyId}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data?.error || 'Failed to delete baby')
        return
      }

      toast.success(`${name} has been removed`)
      router.push('/dashboard/babies')
    } catch (error) {
      toast.error('Failed to delete baby')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Spinner size={22} />
          <span>Loading baby...</span>
        </div>
      </div>
    )
  }

  if (!baby) {
    return <div className="px-4 py-6">Not found</div>
  }

  return (
    <div className="w-full space-y-6">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Baby Profile?</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <span className="font-semibold text-pink-600">{name}</span>&apos;s profile?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Warning: This action cannot be undone. All recordings, data, and information associated with this baby will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Spinner size={16} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FaTrash className="text-sm" />
                    <span>Delete Forever</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="w-full overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 shadow-sm">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt={name} className="w-full h-64 md:h-full object-cover" />
          </div>
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{name}</h1>
                <p className="mt-2 text-gray-600">
                  {age || '—'} {gender ? `• ${capitalize(gender)}` : ''} {bloodType ? `• ${bloodType}` : ''}
                </p>
              </div>
              <button
                onClick={handleDelete}
                disabled={deleting || showDeleteConfirm}
                className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 hover:border-red-300 disabled:opacity-50"
                title="Delete baby profile"
              >
                {deleting ? (
                  <Spinner size={20} />
                ) : (
                  <FaTrash className="text-lg" />
                )}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Stat label="Weight" value={weightKg ? `${weightKg} kg` : '—'} />
              <Stat label="Height" value={heightCm ? `${heightCm} cm` : '—'} />
              <Stat label="Relations" value={Array.isArray(baby?.baby_parents) ? baby.baby_parents.length : 0} />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-white rounded-2xl border border-pink-100 p-5 shadow-sm bg-gradient-to-br from-white to-pink-50/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">
          {notes || 'No medical notes added yet.'}
        </p>
      </section>

      {/* Quick Edit */}
      <section className="bg-white rounded-2xl border border-pink-100 p-5 shadow-sm bg-gradient-to-br from-white to-pink-50/20">
        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">Quick Edit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Name</label>
            <input className="w-full rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 transition-all" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Birth Date</label>
            <input type="date" className="w-full rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 transition-all" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Gender</label>
            <select className="w-full rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 transition-all" value={gender} onChange={e => setGender(e.target.value as any)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Blood Type</label>
            <select className="w-full rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 transition-all" value={bloodType} onChange={e => setBloodType(e.target.value)}>
              <option value="">Select</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Birth Weight (kg)</label>
            <input type="number" className="w-full rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 transition-all" value={weightKg} onChange={e => setWeightKg(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1 font-medium">Birth Height (cm)</label>
            <input type="number" className="w-full rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 transition-all" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1 font-medium">Medical Notes</label>
            <textarea rows={3} className="w-full rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-300 transition-all" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Relations */}
      <section className="bg-white rounded-2xl border border-pink-100 p-5 shadow-sm bg-gradient-to-br from-white to-pink-50/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Relations</h2>
        {Array.isArray(baby?.baby_parents) && baby.baby_parents.length > 0 ? (
          <ul className="space-y-2">
            {baby.baby_parents.map((r: any, idx: number) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{r?.parent_profile?.full_name || 'Unknown'}</span>
                <span className="text-gray-500">{capitalize(r?.relationship || 'other')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No relations connected yet.</p>
        )}
      </section>

      {/* Recording */}
      <section className="bg-white rounded-2xl border border-pink-100 p-5 shadow-sm bg-gradient-to-br from-white to-pink-50/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Create New Recording</h2>
        <RecordingSection
          onSave={handleSaveRecording}
          selectedBaby={selectedBaby}
          babyId={babyId}
        />
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50/50 to-rose-50/50 p-3">
      <div className="text-xs uppercase tracking-wide text-pink-600 font-semibold">{label}</div>
      <div className="mt-1 text-gray-900 font-medium">{value}</div>
    </div>
  )
}

function formatAge(birthDateISO: string): string {
  try {
    if (!birthDateISO) return ''
    const bd = new Date(birthDateISO)
    const now = new Date()
    const months = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth())
    if (months <= 0) return 'Newborn'
    if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
    const years = Math.floor(months / 12)
    const remMonths = months % 12
    return remMonths ? `${years}y ${remMonths}m` : `${years}y`
  } catch {
    return ''
  }
}

function capitalize(s: string) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}



