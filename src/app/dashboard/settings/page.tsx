'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FaUser,
  FaPhone,
  FaImage,
  FaSave,
  FaArrowLeft,
  FaBaby,
  FaComments,
  FaBook,
  FaFile,
  FaUsers,
  FaBell,
  FaUserTimes,
} from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Json } from '@/types/supabase'
import { useAuth } from '@/lib/supabase/context'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  parseNotificationPreferences,
} from '@/lib/notification-preferences'

interface Profile {
  id: string
  full_name: string
  phone_number: string | null
  avatar_url: string | null
  role: string | null
  created_at: string | null
  metadata: Json | null
}

interface Stats {
  babies: number
  blogPosts: number
  forumThreads: number
  resources: number
}

interface FamilyBaby {
  id: string
  name: string
}

interface FamilyMemberRow {
  parentId: string
  fullName: string
  relationship: string
  accessLevel: string
  isPrimary: boolean
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-pink-50 last:border-0 ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-900 cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative shrink-0 inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:cursor-not-allowed ${
          checked ? 'bg-pink-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    babies: 0,
    blogPosts: 0,
    forumThreads: 0,
    resources: 0,
  })
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    avatar_url: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [familyBabies, setFamilyBabies] = useState<FamilyBaby[]>([])
  const [membersByBaby, setMembersByBaby] = useState<Record<string, FamilyMemberRow[]>>({})
  const [familyLoading, setFamilyLoading] = useState(false)
  const [updatingMemberKey, setUpdatingMemberKey] = useState<string | null>(null)
  const [removingMemberKey, setRemovingMemberKey] = useState<string | null>(null)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() => ({ ...DEFAULT_NOTIFICATION_PREFERENCES }))
  const [notifPrefsSaving, setNotifPrefsSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      loadStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (data.profile) {
        setProfile(data.profile)
        setFormData({
          full_name: data.profile.full_name || '',
          phone_number: data.profile.phone_number || '',
          avatar_url: data.profile.avatar_url || '',
        })
        if (data.profile.avatar_url) {
          setAvatarPreview(data.profile.avatar_url)
        }
        setNotifPrefs(parseNotificationPreferences(data.profile.metadata))
      }
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!profile) return

    try {
      setFamilyLoading(true)
      const [babiesRes, blogRes, forumRes, resourcesRes] = await Promise.all([
        fetch('/api/babies'),
        fetch('/api/community/blog'),
        fetch('/api/community/forum/threads'),
        fetch('/api/community/resources'),
      ])

      const babiesData = await babiesRes.json()
      const blogData = await blogRes.json()
      const forumData = await forumRes.json()
      const resourcesData = await resourcesRes.json()

      const allBabies = babiesData.babies || []
      setStats({
        babies: allBabies.length || 0,
        blogPosts: blogData.posts?.filter((p: any) => p.author?.id === profile.id).length || 0,
        forumThreads: forumData.threads?.filter((t: any) => t.author?.id === profile.id).length || 0,
        resources: resourcesData.resources?.filter((r: any) => r.uploader?.id === profile.id).length || 0,
      })

      const primaryList: FamilyBaby[] = allBabies
        .filter((b: any) => b.iAmPrimary)
        .map((b: any) => ({ id: b.id, name: b.name || 'Baby' }))
      setFamilyBabies(primaryList)

      if (primaryList.length === 0) {
        setMembersByBaby({})
      } else {
        const map: Record<string, FamilyMemberRow[]> = {}
        await Promise.all(
          primaryList.map(async (b) => {
            const mRes = await fetch(`/api/babies/${b.id}/members`)
            const mJson = await mRes.json().catch(() => ({}))
            map[b.id] = mRes.ok && Array.isArray(mJson.members) ? mJson.members : []
          }),
        )
        setMembersByBaby(map)
      }
    } catch (error) {
      console.error('Failed to load stats')
    } finally {
      setFamilyLoading(false)
    }
  }

  const updateMemberAccess = async (babyId: string, parentId: string, access: 'full' | 'read_only') => {
    const key = `${babyId}:${parentId}`
    setUpdatingMemberKey(key)
    try {
      const res = await fetch(`/api/babies/${babyId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, access }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to update access')
        return
      }
      toast.success('Access updated')
      setMembersByBaby((prev) => ({
        ...prev,
        [babyId]: (prev[babyId] || []).map((m) =>
          m.parentId === parentId ? { ...m, accessLevel: access } : m,
        ),
      }))
    } catch {
      toast.error('Failed to update access')
    } finally {
      setUpdatingMemberKey(null)
    }
  }

  const removeMemberFromFamily = async (babyId: string, babyName: string, m: FamilyMemberRow) => {
    const key = `${babyId}:${m.parentId}`
    const ok = window.confirm(
      `Remove ${m.fullName} from ${babyName}'s care circle? They will lose access to this child.`,
    )
    if (!ok) return

    setRemovingMemberKey(key)
    try {
      const res = await fetch(
        `/api/babies/${encodeURIComponent(babyId)}/members?parentId=${encodeURIComponent(m.parentId)}`,
        { method: 'DELETE' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to remove access')
        return
      }
      toast.success(`${m.fullName} no longer has access to ${babyName}`)
      setMembersByBaby((prev) => ({
        ...prev,
        [babyId]: (prev[babyId] || []).filter((row) => row.parentId !== m.parentId),
      }))
    } catch {
      toast.error('Failed to remove access')
    } finally {
      setRemovingMemberKey(null)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    try {
      const formData = new FormData()
      formData.append('file', avatarFile)
      const res = await fetch('/api/uploads/profile-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, avatar_url: data.url }))
        toast.success('Avatar uploaded successfully')
        return data.url
      } else {
        toast.error(data.error || 'Failed to upload avatar')
        return null
      }
    } catch (error) {
      toast.error('Failed to upload avatar')
      return null
    }
  }

  const saveNotificationPreferences = async () => {
    setNotifPrefsSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: notifPrefs }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to save notification preferences')
        return
      }
      if (data.profile) {
        setProfile(data.profile)
        setNotifPrefs(parseNotificationPreferences(data.profile.metadata))
      }
      await refreshUser()
      toast.success('Notification preferences saved')
      router.refresh()
    } catch {
      toast.error('Failed to save notification preferences')
    } finally {
      setNotifPrefsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Upload avatar first if a new file was selected
      let finalAvatarUrl = formData.avatar_url
      if (avatarFile) {
        const uploadedUrl = await handleAvatarUpload()
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl
        } else {
          setSaving(false)
          return
        }
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone_number: formData.phone_number || null,
          avatar_url: finalAvatarUrl || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Profile updated successfully!')
        setProfile(data.profile)
        setAvatarFile(null)
        // Refresh the page to show updated data
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700"
        >
          <FaArrowLeft />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-8">
        Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaImage className="inline mr-1" />
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Image
                      src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name)}&background=ec4899&color=ffffff&size=128`}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-2 border-pink-200"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 5MB</p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaUser className="inline mr-1" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaPhone className="inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Role (Read-only) */}
              {profile?.role && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <FaSave />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      full_name: profile?.full_name || '',
                      phone_number: profile?.phone_number || '',
                      avatar_url: profile?.avatar_url || '',
                    })
                    setAvatarFile(null)
                    setAvatarPreview(profile?.avatar_url || '')
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Notification preferences */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FaBell className="text-pink-600" />
              Notification preferences
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Choose what we can notify you about. In-app sound and bell highlight apply on the dashboard when new items
              arrive. Family and community toggles control those notification categories.
            </p>

            <div className="rounded-lg border border-pink-100 bg-gradient-to-br from-white to-pink-50/20 px-4">
              <ToggleRow
                id="pref-family-invites"
                label="Family invites"
                description={"When someone invites you to a baby's care circle."}
                checked={notifPrefs.familyInvites}
                onChange={(v) => setNotifPrefs((p) => ({ ...p, familyInvites: v }))}
              />
              <ToggleRow
                id="pref-community"
                label="Community activity"
                description="Forum and blog: replies on your threads or posts, replies to your messages, and @mentions (use @ plus a user profile ID)."
                checked={notifPrefs.community}
                onChange={(v) => setNotifPrefs((p) => ({ ...p, community: v }))}
              />
              <ToggleRow
                id="pref-sound"
                label="In-app sound for new notifications"
                description="Short beep when a new notification arrives (if your browser allows audio)."
                checked={notifPrefs.inAppSound}
                onChange={(v) => setNotifPrefs((p) => ({ ...p, inAppSound: v }))}
              />
              <ToggleRow
                id="pref-highlight"
                label="Highlight notification bell"
                description="Pink ring and motion on the bell when there is something new."
                checked={notifPrefs.highlightBell}
                onChange={(v) => setNotifPrefs((p) => ({ ...p, highlightBell: v }))}
              />
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-gray-900">Oximeter readings</h3>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  Feature coming soon
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                SpO₂ and pulse alerts from a connected oximeter will appear here. These options are not available yet.
              </p>
              <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4">
                <ToggleRow
                  id="pref-oxi-spo2"
                  label="Low oxygen (SpO₂) alerts"
                  description="Notify when oxygen saturation drops below your chosen threshold."
                  checked={false}
                  onChange={() => {}}
                  disabled
                />
                <ToggleRow
                  id="pref-oxi-pulse"
                  label="Heart rate alerts"
                  description="Notify when pulse is unusually high or low."
                  checked={false}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                type="button"
                disabled={notifPrefsSaving}
                onClick={() => void saveNotificationPreferences()}
                className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <FaSave />
                {notifPrefsSaving ? 'Saving…' : 'Save notification preferences'}
              </button>
              <button
                type="button"
                disabled={notifPrefsSaving || !profile}
                onClick={() => setNotifPrefs(parseNotificationPreferences(profile?.metadata))}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Family access — guardians & relatives */}
          {familyBabies.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FaUsers className="text-pink-600" />
                Family access
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                For each child where you are the primary parent, set whether another caregiver has full access (edit profile,
                delete records, same as you) or read-only access (log feeding and sleep, view the child — no edits or
                deletions). You can remove a caregiver entirely with <span className="font-medium">Remove access</span> — they
                will no longer see this child in their account.
              </p>
              {familyLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600" />
                  Loading caregivers…
                </div>
              ) : (
                <div className="space-y-8">
                  {familyBabies.map((baby) => {
                    const members = (membersByBaby[baby.id] || []).filter((m) => !m.isPrimary)
                    return (
                      <div key={baby.id} className="border border-pink-100 rounded-lg p-4 bg-gradient-to-br from-white to-pink-50/30">
                        <h3 className="font-semibold text-gray-900 mb-3">{baby.name}</h3>
                        {members.length === 0 ? (
                          <p className="text-sm text-gray-600">
                            No other caregivers linked yet. Invite a guardian or relative from this child&apos;s page.
                          </p>
                        ) : (
                          <ul className="space-y-3">
                            {members.map((m) => {
                              const rowKey = `${baby.id}:${m.parentId}`
                              const value = m.accessLevel === 'full' ? 'full' : 'read_only'
                              return (
                                <li
                                  key={m.parentId}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2 border-b border-pink-50 last:border-0"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{m.fullName}</p>
                                    <p className="text-xs text-gray-500 capitalize">{m.relationship}</p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <label htmlFor={`access-${rowKey}`} className="sr-only">
                                      Access for {m.fullName}
                                    </label>
                                    <select
                                      id={`access-${rowKey}`}
                                      value={value}
                                      disabled={updatingMemberKey === rowKey || removingMemberKey === rowKey}
                                      onChange={(e) => {
                                        const next = e.target.value as 'full' | 'read_only'
                                        if (next === value) return
                                        void updateMemberAccess(baby.id, m.parentId, next)
                                      }}
                                      className="text-sm border border-pink-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50"
                                    >
                                      <option value="read_only">Read only</option>
                                      <option value="full">Full access</option>
                                    </select>
                                    <button
                                      type="button"
                                      disabled={updatingMemberKey === rowKey || removingMemberKey === rowKey}
                                      onClick={() => void removeMemberFromFamily(baby.id, baby.name, m)}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      title={`Remove ${m.fullName} from this child`}
                                    >
                                      <FaUserTimes className="text-xs" aria-hidden />
                                      {removingMemberKey === rowKey ? 'Removing…' : 'Remove access'}
                                    </button>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Account Created</span>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">User ID</span>
                <span className="text-sm font-mono text-gray-500 text-xs">
                  {profile?.id.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Activity</h2>
            <div className="space-y-4">
              <Link
                href="/dashboard/babies"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <FaBaby className="text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Babies</p>
                  <p className="text-xs text-gray-500">{stats.babies} registered</p>
                </div>
              </Link>

              <Link
                href="/dashboard/community?tab=blog"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FaBook className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Blog Posts</p>
                  <p className="text-xs text-gray-500">{stats.blogPosts} published</p>
                </div>
              </Link>

              <Link
                href="/dashboard/community?tab=forums"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <FaComments className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Forum Threads</p>
                  <p className="text-xs text-gray-500">{stats.forumThreads} started</p>
                </div>
              </Link>

              <Link
                href="/dashboard/community?tab=resources"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FaFile className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Resources</p>
                  <p className="text-xs text-gray-500">{stats.resources} shared</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl shadow-lg p-6 border border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/community"
                className="block text-sm text-pink-700 hover:text-pink-800 hover:underline"
              >
                → Community Hub
              </Link>
              <Link
                href="/dashboard/babies"
                className="block text-sm text-pink-700 hover:text-pink-800 hover:underline"
              >
                → My Babies
              </Link>
              <Link
                href="/dashboard/community/guidelines"
                className="block text-sm text-pink-700 hover:text-pink-800 hover:underline"
              >
                → Community Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

