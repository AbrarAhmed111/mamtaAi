'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Spinner from '@/components/ui/spinner'
import { toast } from '@/components/ui/sonner'
import { FaTrash, FaExclamationTriangle, FaUser, FaUserMinus } from 'react-icons/fa'
import { accessBadgeLabel } from '@/lib/baby-permissions'

export default function BabyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const babyId = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [baby, setBaby] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currentUserRelationship, setCurrentUserRelationship] = useState<string>('')
  const [canEditBaby, setCanEditBaby] = useState(true)
  const [currentAccessBadge, setCurrentAccessBadge] = useState('')
  const [canLeaveMembership, setCanLeaveMembership] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [leavingMembership, setLeavingMembership] = useState(false)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'' | 'male' | 'female'>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [heightCm, setHeightCm] = useState<string>('')
  const [bloodType, setBloodType] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  type FeedingRecord = {
    id: string
    timestamp: string
    feedingType: 'breast' | 'formula' | 'solid' | 'other'
    amountMl?: number
    notes?: string
  }

  type SleepRecord = {
    id: string
    startTime: string
    endTime: string
    durationMinutes: number
    notes?: string
  }

  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([])
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [savingFeeding, setSavingFeeding] = useState(false)
  const [savingSleep, setSavingSleep] = useState(false)

  const [feedingTime, setFeedingTime] = useState('')
  const [feedingType, setFeedingType] = useState<FeedingRecord['feedingType']>('breast')
  const [feedingAmount, setFeedingAmount] = useState('')
  const [feedingNotes, setFeedingNotes] = useState('')

  const [sleepStart, setSleepStart] = useState('')
  const [sleepEnd, setSleepEnd] = useState('')
  const [sleepNotes, setSleepNotes] = useState('')


  const age = useMemo(() => formatAge(birthDate), [birthDate])
  const avatar = baby?.avatar_url || ''

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
        setCurrentUserRelationship(String(data.currentUserRelationship || ''))
        setCanEditBaby(data.canEditBaby !== false)
        setCurrentAccessBadge(String(data.currentAccessBadge || ''))
        setCanLeaveMembership(data.canLeaveMembership === true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [babyId])

  const loadActivityRecords = useCallback(async () => {
    if (!babyId) return
    try {
      setRecordsLoading(true)
      const res = await fetch(`/api/babies/${babyId}/activities`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to load records')
        return
      }
      const items = Array.isArray(data.items) ? data.items : []
      const feeding = items
        .filter((item: any) => item.activity_type === 'feeding')
        .map((item: any) => ({
          id: item.id,
          timestamp: item.started_at,
          feedingType: mapFeedingTypeFromDb(item.feeding_type || item.food_type),
          amountMl: item.amount_ml ?? undefined,
          notes: item.notes || undefined,
        }))
      const sleep = items
        .filter((item: any) => item.activity_type === 'sleep')
        .map((item: any) => ({
          id: item.id,
          startTime: item.started_at,
          endTime: item.ended_at,
          durationMinutes: item.duration_minutes ?? computeDurationMinutes(item.started_at, item.ended_at),
          notes: item.notes || undefined,
        }))
      setFeedingRecords(feeding)
      setSleepRecords(sleep)
    } finally {
      setRecordsLoading(false)
    }
  }, [babyId])

  useEffect(() => {
    void loadActivityRecords()
  }, [loadActivityRecords])

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


  const handleLeaveMembership = async () => {
    if (!babyId) return
    try {
      setLeavingMembership(true)
      const res = await fetch(`/api/babies/${babyId}/membership`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Could not leave this profile')
        return
      }
      toast.success(`You are no longer linked to ${name || 'this child'}`)
      router.push('/dashboard/babies')
    } finally {
      setLeavingMembership(false)
      setShowLeaveConfirm(false)
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

  const addFeedingRecord = async () => {
    if (!feedingTime) {
      toast.error('Please select a feeding time')
      return
    }
    const start = new Date(feedingTime)
    if (Number.isNaN(start.getTime())) {
      toast.error('Invalid feeding time')
      return
    }
    if (start.getTime() > Date.now() + 5 * 60 * 1000) {
      toast.error('Feeding time cannot be in the future')
      return
    }
    if (feedingAmount !== '') {
      const amount = Number(feedingAmount)
      if (Number.isNaN(amount) || amount < 0 || amount > 1000) {
        toast.error('Feeding amount must be between 0 and 1000 ml')
        return
      }
    }
    if (!babyId) return
    try {
      setSavingFeeding(true)
      const payload = {
        activity_type: 'feeding',
        started_at: new Date(feedingTime).toISOString(),
      feeding_type: feedingType,
        amount_ml: feedingAmount !== '' ? Number(feedingAmount) : undefined,
        notes: feedingNotes.trim() || undefined,
      }
      const res = await fetch(`/api/babies/${babyId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to save feeding record')
        return
      }
      setFeedingTime('')
      setFeedingAmount('')
      setFeedingNotes('')
      await loadActivityRecords()
    } finally {
      setSavingFeeding(false)
    }
  }

  const deleteFeedingRecord = async (id: string) => {
    if (!babyId) return
    const res = await fetch(`/api/babies/${babyId}/activities?activity_id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data?.error || 'Failed to delete record')
      return
    }
    await loadActivityRecords()
  }

  const addSleepRecord = async () => {
    if (!sleepStart || !sleepEnd) {
      toast.error('Please select both sleep start and end times')
      return
    }
    const start = new Date(sleepStart)
    const end = new Date(sleepEnd)
    const durationMs = end.getTime() - start.getTime()
    if (Number.isNaN(durationMs) || durationMs <= 0) {
      toast.error('Sleep end time must be after start time')
      return
    }
    if (start.getTime() > Date.now() + 5 * 60 * 1000 || end.getTime() > Date.now() + 5 * 60 * 1000) {
      toast.error('Sleep times cannot be in the future')
      return
    }
    if (durationMs > 24 * 60 * 60 * 1000) {
      toast.error('Sleep duration cannot exceed 24 hours')
      return
    }
    const durationMinutes = Math.round(durationMs / 60000)
    if (!babyId) return
    try {
      setSavingSleep(true)
      const payload = {
        activity_type: 'sleep',
        started_at: new Date(sleepStart).toISOString(),
        ended_at: new Date(sleepEnd).toISOString(),
        notes: sleepNotes.trim() || undefined,
      }
      const res = await fetch(`/api/babies/${babyId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to save sleep record')
        return
      }
      setSleepStart('')
      setSleepEnd('')
      setSleepNotes('')
      await loadActivityRecords()
    } finally {
      setSavingSleep(false)
    }
  }

  const deleteSleepRecord = async (id: string) => {
    if (!babyId) return
    const res = await fetch(`/api/babies/${babyId}/activities?activity_id=${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data?.error || 'Failed to delete record')
      return
    }
    await loadActivityRecords()
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

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <FaUserMinus className="text-gray-700 text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Leave this profile?</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                You will remove yourself as <span className="font-semibold capitalize">{currentUserRelationship || 'caregiver'}</span> for{' '}
                <span className="font-semibold text-pink-600">{name}</span>. You can be invited again later if the family adds you back.
              </p>
              <p className="text-sm text-gray-500">This only affects your access — the child&apos;s profile stays for the primary parent and other caregivers.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                disabled={leavingMembership}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleLeaveMembership()}
                disabled={leavingMembership}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {leavingMembership ? (
                  <>
                    <Spinner size={16} />
                    <span>Leaving…</span>
                  </>
                ) : (
                  <>
                    <FaUserMinus className="text-sm" />
                    <span>Leave profile</span>
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
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={name} className="w-full h-64 md:h-full object-cover" />
            ) : (
              <div
                className={`w-full h-64 md:h-full flex items-center justify-center ${
                  gender === 'male' ? 'bg-blue-50' : gender === 'female' ? 'bg-pink-50' : 'bg-gray-50'
                }`}
              >
                <FaUser
                  className={`text-5xl ${
                    gender === 'male' ? 'text-blue-300' : gender === 'female' ? 'text-pink-300' : 'text-gray-300'
                  }`}
                />
              </div>
            )}
          </div>
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{name}</h1>
                <p className="mt-2 text-gray-600">
                  {age || '—'} {gender ? `• ${capitalize(gender)}` : ''} {bloodType ? `• ${bloodType}` : ''}
                </p>
                {currentUserRelationship && (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-700 capitalize">
                      You are {currentUserRelationship}
                    </span>
                    {currentAccessBadge ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-100">
                        {currentAccessBadge}
                      </span>
                    ) : null}
                  </p>
                )}
              </div>
              {canEditBaby ? (
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
              ) : null}
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
        {!canEditBaby ? (
          <p className="text-sm text-gray-600">
            You have read-only access for this child. You can log feeding and sleep below and view their information; profile edits and deletions are limited to full-access caregivers.
          </p>
        ) : null}
        {canEditBaby ? (
        <>
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
        </>
        ) : null}
      </section>

      {/* Relations */}
      <section className="bg-white rounded-2xl border border-pink-100 p-5 shadow-sm bg-gradient-to-br from-white to-pink-50/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Relations</h2>
        {Array.isArray(baby?.baby_parents) && baby.baby_parents.length > 0 ? (
          <ul className="space-y-2">
            {baby.baby_parents.map((r: any, idx: number) => {
              const accessLabel = accessBadgeLabel({
                baby_id: baby.id,
                parent_id: r.parent_id,
                relationship: r.relationship,
                access_level: r.access_level,
                can_edit_profile: r.can_edit_profile,
                can_record_audio: null,
                can_view_history: null,
                is_primary: r.is_primary,
              })
              return (
                <li key={r.parent_id || idx} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-gray-800">{r?.parent_profile?.full_name || 'Unknown'}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-500 capitalize">{r?.relationship || 'other'}</span>
                    {accessLabel ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-800 border border-pink-100">
                        {accessLabel}
                      </span>
                    ) : null}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No relations connected yet.</p>
        )}
      </section>

      {canLeaveMembership && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your link to this child</h2>
          <p className="text-sm text-gray-600 mb-4">
            You were added as a family caregiver. If you no longer want access to {name}&apos;s profile, you can remove yourself.
            The family&apos;s data stays intact for everyone else.
          </p>
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <FaUserMinus className="text-gray-600" />
            Leave this child&apos;s profile
          </button>
        </section>
      )}

      {/* Feeding & Sleep Records */}
      <section className="bg-white rounded-2xl border border-pink-100 p-5 shadow-sm bg-gradient-to-br from-white to-pink-50/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Feeding & Sleep Records</h2>
        {recordsLoading && (
          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
            <Spinner size={14} />
            <span>Loading records...</span>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-pink-100 bg-white/80 p-4">
            <h3 className="text-sm font-semibold text-pink-700">Add Feeding Record</h3>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={feedingTime}
                  onChange={e => setFeedingTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Type</label>
                <select
                  className="w-full rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={feedingType}
                  onChange={e => setFeedingType(e.target.value as FeedingRecord['feedingType'])}
                >
                  <option value="breast">Breast</option>
                  <option value="formula">Formula</option>
                  <option value="solid">Solid</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Amount (ml)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={feedingAmount}
                  onChange={e => setFeedingAmount(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={feedingNotes}
                  onChange={e => setFeedingNotes(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <button
                onClick={addFeedingRecord}
                disabled={savingFeeding}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white hover:from-pink-600 hover:to-rose-600 transition-colors"
              >
                {savingFeeding ? (
                  <>
                    <Spinner size={14} />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  'Add Feeding Record'
                )}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {recordsLoading && feedingRecords.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Spinner size={14} />
                  <span>Loading feeding records...</span>
                </div>
              ) : feedingRecords.length === 0 ? (
                <p className="text-xs text-gray-500">No feeding records yet.</p>
              ) : (
                feedingRecords.map(record => (
                  <div key={record.id} className="flex items-start justify-between rounded-lg border border-gray-100 bg-white p-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">{record.feedingType}</div>
                      <div className="text-gray-600">{new Date(record.timestamp).toLocaleString()}</div>
                      {record.amountMl !== undefined && (
                        <div className="text-gray-600">Amount: {record.amountMl} ml</div>
                      )}
                      {record.notes && <div className="text-gray-600">{record.notes}</div>}
                    </div>
                    {canEditBaby ? (
                      <button
                        onClick={() => deleteFeedingRecord(record.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-pink-100 bg-white/80 p-4">
            <h3 className="text-sm font-semibold text-pink-700">Add Sleep Record</h3>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={sleepStart}
                  onChange={e => setSleepStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={sleepEnd}
                  onChange={e => setSleepEnd(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  value={sleepNotes}
                  onChange={e => setSleepNotes(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <button
                onClick={addSleepRecord}
                disabled={savingSleep}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white hover:from-pink-600 hover:to-rose-600 transition-colors"
              >
                {savingSleep ? (
                  <>
                    <Spinner size={14} />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  'Add Sleep Record'
                )}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {recordsLoading && sleepRecords.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Spinner size={14} />
                  <span>Loading sleep records...</span>
                </div>
              ) : sleepRecords.length === 0 ? (
                <p className="text-xs text-gray-500">No sleep records yet.</p>
              ) : (
                sleepRecords.map(record => (
                  <div key={record.id} className="flex items-start justify-between rounded-lg border border-gray-100 bg-white p-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        {new Date(record.startTime).toLocaleString()} → {new Date(record.endTime).toLocaleString()}
                      </div>
                      <div className="text-gray-600">
                        Duration: {Math.floor(record.durationMinutes / 60)}h {record.durationMinutes % 60}m
                      </div>
                      {record.notes && <div className="text-gray-600">{record.notes}</div>}
                    </div>
                    {canEditBaby ? (
                      <button
                        onClick={() => deleteSleepRecord(record.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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

function mapFeedingTypeToDb(type: 'breast' | 'formula' | 'solid' | 'other') {
  if (type === 'breast') return 'breast_both'
  if (type === 'formula') return 'bottle'
  if (type === 'solid') return 'solid'
  return null
}

function mapFeedingTypeFromDb(type: string | null | undefined): 'breast' | 'formula' | 'solid' | 'other' {
  if (type === 'breast_left' || type === 'breast_right' || type === 'breast_both') return 'breast'
  if (type === 'bottle') return 'formula'
  if (type === 'solid') return 'solid'
  if (type === 'breast') return 'breast'
  if (type === 'formula') return 'formula'
  if (type === 'other') return 'other'
  return 'other'
}

function computeDurationMinutes(start?: string, end?: string) {
  if (!start || !end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  const durationMs = endDate.getTime() - startDate.getTime()
  if (Number.isNaN(durationMs) || durationMs <= 0) return 0
  return Math.round(durationMs / 60000)
}



