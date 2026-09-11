'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaSave, FaStar } from 'react-icons/fa'
import { toast } from '@/components/ui/sonner'
import Spinner from '@/components/ui/spinner'

type ExpertProfileData = {
  profile: {
    fullName: string
    avatarUrl: string | null
    professionalTitle: string
    specialization: string
    licenseNumber: string
    yearsOfExperience: string
    bio: string
    isNewExpert: boolean
  }
}

export default function ExpertProfileEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    professionalTitle: '',
    specialization: '',
    yearsOfExperience: '',
    bio: '',
  })
  const [meta, setMeta] = useState<{ fullName: string; avatarUrl: string | null; isNewExpert: boolean } | null>(
    null,
  )

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/experts/profile', { cache: 'no-store' })
        const data = (await res.json().catch(() => ({}))) as ExpertProfileData & { error?: string }
        if (!res.ok) throw new Error(data.error || 'Failed to load profile')
        setForm({
          professionalTitle: data.profile.professionalTitle || '',
          specialization: data.profile.specialization || '',
          yearsOfExperience: data.profile.yearsOfExperience || '',
          bio: data.profile.bio || '',
        })
        setMeta({
          fullName: data.profile.fullName,
          avatarUrl: data.profile.avatarUrl,
          isNewExpert: data.profile.isNewExpert,
        })
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/experts/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success('Expert profile updated')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          My expert profile
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          This information appears in the{' '}
          <Link href="/dashboard/experts" className="font-medium text-pink-600 hover:text-pink-700">
            expert directory
          </Link>
          .
        </p>
      </div>

      {meta?.isNewExpert ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <FaStar className="shrink-0 text-emerald-600" />
          <span>
            You&apos;re a <strong>new expert</strong> — your profile shows a &quot;New&quot; badge for your first 7
            days on the directory.
          </span>
        </div>
      ) : null}

      <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm shadow-pink-100/30">
        <div className="mb-6 flex items-center gap-4">
          <Image
            src={
              meta?.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(meta?.fullName || 'Expert')}&background=FCE7F3&color=9D174D&size=128`
            }
            alt={meta?.fullName || 'Expert'}
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-full object-cover ring-4 ring-pink-100"
          />
          <div>
            <p className="text-lg font-bold text-gray-900">{meta?.fullName}</p>
            <p className="text-sm text-gray-500">Avatar is managed in Settings → Profile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Professional title</label>
            <input
              value={form.professionalTitle}
              onChange={e => setForm(f => ({ ...f, professionalTitle: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="e.g. Pediatrician, IBCLC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Specialization</label>
            <input
              value={form.specialization}
              onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="e.g. Infant sleep, lactation"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Years of experience</label>
            <input
              value={form.yearsOfExperience}
              onChange={e => setForm(f => ({ ...f, yearsOfExperience: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="e.g. 8"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={5}
              className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="Tell parents about your background and how you help families."
            />
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700 disabled:opacity-60"
        >
          <FaSave />
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  )
}
