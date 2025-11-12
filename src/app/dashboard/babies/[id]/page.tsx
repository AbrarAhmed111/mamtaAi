'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Spinner from '@/components/ui/spinner'
import { toast } from '@/components/ui/sonner'
import RecordingSection from '@/components/Dashboard/RecordingSection'

export default function BabyDetailPage() {
  const params = useParams<{ id: string }>()
  const babyId = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [baby, setBaby] = useState<any>(null)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'' | 'male' | 'female'>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [heightCm, setHeightCm] = useState<string>('')
  const [bloodType, setBloodType] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

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

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    const start = Date.now()
    const timer = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    setTimeout(() => {
      clearInterval(timer)
      setIsRecording(false)
      toast.success('Recording saved (demo)')
    }, 8000)
  }

  const stopRecording = () => {
    setIsRecording(false)
    toast.success('Recording stopped (demo)')
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
      {/* Hero */}
      <section className="w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt={name} className="w-full h-64 md:h-full object-cover" />
          </div>
          <div className="flex-1 p-6">
            <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
            <p className="mt-2 text-gray-600">
              {age || '—'} {gender ? `• ${capitalize(gender)}` : ''} {bloodType ? `• ${bloodType}` : ''}
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Stat label="Weight" value={weightKg ? `${weightKg} kg` : '—'} />
              <Stat label="Height" value={heightCm ? `${heightCm} cm` : '—'} />
              <Stat label="Relations" value={Array.isArray(baby?.baby_parents) ? baby.baby_parents.length : 0} />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">
          {notes || 'No medical notes added yet.'}
        </p>
      </section>

      {/* Quick Edit */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Edit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Birth Date</label>
            <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Gender</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={gender} onChange={e => setGender(e.target.value as any)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Blood Type</label>
            <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={bloodType} onChange={e => setBloodType(e.target.value)}>
              <option value="">Select</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Birth Weight (kg)</label>
            <input type="number" className="w-full rounded-md border border-gray-300 px-3 py-2" value={weightKg} onChange={e => setWeightKg(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Birth Height (cm)</label>
            <input type="number" className="w-full rounded-md border border-gray-300 px-3 py-2" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Medical Notes</label>
            <textarea rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Relations */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
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
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Create New Recording</h2>
        <RecordingSection
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-gray-900">{value}</div>
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



