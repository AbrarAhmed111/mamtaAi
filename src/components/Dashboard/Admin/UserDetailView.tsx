'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaBaby, FaExclamationTriangle, FaTrash } from 'react-icons/fa'
import { toast } from '@/components/ui/sonner'
import Spinner from '@/components/ui/spinner'
import Select from '@/components/ui/select'
import ProfileHero from '@/components/Dashboard/shared/ProfileHero'
import DetailSection from '@/components/Dashboard/shared/DetailSection'
import { DETAIL_INPUT_CLASS } from '@/components/Dashboard/shared/detailStyles'
import { ADMIN_BASE_ROLE_OPTIONS } from '@/lib/admin/user-options'
import { formatAccountType } from '@/lib/expert/profile-role'
import { AdminBadge, ADMIN_BTN_PRIMARY } from './AdminUi'

export type AdminUserDetail = {
  id: string
  fullName: string
  phoneNumber: string | null
  email: string | null
  emailConfirmed: boolean
  role: string
  isExpert: boolean
  accountType: string
  isVerified: boolean
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
  lastActiveAt: string | null
  timezone: string | null
  onboardingCompleted: boolean
  suspended: boolean
  suspensionReason: string | null
  suspendedAt: string | null
  verification: {
    professionalTitle: string | null
    yearsOfExperience: string | null
    licenseNumber: string | null
    bio: string | null
    credentials: unknown
  } | null
}

export type AdminUserBaby = {
  linkId: string
  babyId: string | null
  name: string
  avatarUrl: string | null
  birthDate: string | null
  gender: string | null
  isActive: boolean
  relationship: string
  isPrimary: boolean
  accessLevel: string | null
  invitationStatus: string
}

export type AdminUserRecording = {
  id: string
  durationSeconds: number | null
  recordedAt: string
  processingStatus: string | null
  babyName: string
}

type UserDetailPayload = {
  user: AdminUserDetail
  stats: { babies: number; recordings: number }
  babies: AdminUserBaby[]
  subscription: {
    id: string
    status: string
    currentPeriodEnd: string | null
    planSlug: string
    planName: string
    priceUsd: number
  } | null
  recentRecordings: AdminUserRecording[]
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function capitalize(s: string) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function UserDetailView({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [data, setData] = useState<UserDetailPayload | null>(null)

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [role, setRole] = useState('')
  const [isExpert, setIsExpert] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to load user')
      setData(json)
      const u = json.user as AdminUserDetail
      setFullName(u.fullName)
      setPhoneNumber(u.phoneNumber || '')
      setAvatarUrl(u.avatarUrl || '')
      setRole(u.role)
      setIsExpert(u.isExpert)
      setSuspensionReason(u.suspensionReason || '')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const patchUser = async (body: Record<string, unknown>, successMessage = 'User updated') => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Update failed')
      toast.success(successMessage)
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = () =>
    void patchUser({
      fullName,
      phoneNumber: phoneNumber || null,
      avatarUrl: avatarUrl || null,
      role,
      isExpert,
    })

  const toggleSuspend = async () => {
    if (!data) return
    setActionLoading(true)
    try {
      if (data.user.suspended) {
        await patchUser({ suspended: false }, 'User reactivated')
      } else {
        await patchUser(
          {
            suspended: true,
            suspensionReason: suspensionReason.trim() || 'Account suspended by administrator',
          },
          'User suspended',
        )
      }
    } finally {
      setActionLoading(false)
    }
  }

  const deleteUser = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Delete failed')
      toast.success('User deleted')
      router.push('/dashboard/admin/users')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setActionLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={32} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-pink-100 bg-white p-8 text-center">
        <p className="text-gray-600">User not found.</p>
        <Link href="/dashboard/admin/users" className="mt-4 inline-block text-pink-600 hover:underline">
          Back to users
        </Link>
      </div>
    )
  }

  const { user, stats, babies, subscription, recentRecordings } = data
  const displayAvatar = avatarUrl.trim() || user.avatarUrl

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/admin/users"
        className="inline-flex items-center gap-2 text-sm font-medium text-pink-600 hover:text-pink-700"
      >
        <FaArrowLeft className="text-xs" />
        Back to users
      </Link>

      <ProfileHero
        imageUrl={displayAvatar}
        name={user.fullName}
        subtitle={
          <>
            {user.email || 'No email'}
            {user.phoneNumber ? ` • ${user.phoneNumber}` : ''}
          </>
        }
        badges={
          <>
            <AdminBadge tone="pink">{user.accountType || formatAccountType(user.role, user.isExpert)}</AdminBadge>
            {user.suspended ? (
              <AdminBadge tone="rose">Suspended</AdminBadge>
            ) : (
              <AdminBadge tone="green">Active</AdminBadge>
            )}
            {user.isExpert ? (
              <AdminBadge tone="green">Verified expert</AdminBadge>
            ) : null}
            {user.emailConfirmed ? (
              <AdminBadge tone="purple">Email verified</AdminBadge>
            ) : (
              <AdminBadge tone="gray">Email unverified</AdminBadge>
            )}
          </>
        }
        action={
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={actionLoading}
            className="rounded-xl border border-red-200 p-3 text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
            title="Delete user account"
          >
            <FaTrash className="text-lg" />
          </button>
        }
        stats={[
          { label: 'Babies', value: stats.babies },
          { label: 'Recordings', value: stats.recordings },
          { label: 'Joined', value: new Date(user.createdAt).toLocaleDateString() },
        ]}
        placeholderClassName={
          user.isExpert ? 'bg-emerald-50' : user.role === 'admin' ? 'bg-purple-50' : 'bg-pink-50'
        }
      />

      {user.suspended && user.suspensionReason ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800">
          <p className="font-semibold">Suspension reason</p>
          <p className="mt-1">{user.suspensionReason}</p>
          {user.suspendedAt ? (
            <p className="mt-1 text-xs text-rose-600">Since {formatDate(user.suspendedAt)}</p>
          ) : null}
        </div>
      ) : null}

      <DetailSection title="Account overview">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">User ID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-gray-800">{user.id}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Last active</dt>
            <dd className="mt-1 text-gray-900">{formatDate(user.lastActiveAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Timezone</dt>
            <dd className="mt-1 text-gray-900">{user.timezone || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Onboarding</dt>
            <dd className="mt-1 text-gray-900">{user.onboardingCompleted ? 'Completed' : 'Incomplete'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Profile updated</dt>
            <dd className="mt-1 text-gray-900">{formatDate(user.updatedAt)}</dd>
          </div>
          {subscription ? (
            <div>
              <dt className="text-gray-500">Subscription</dt>
              <dd className="mt-1 text-gray-900">
                {subscription.planName} ({subscription.status})
                {subscription.currentPeriodEnd
                  ? ` — renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : ''}
              </dd>
            </div>
          ) : (
            <div>
              <dt className="text-gray-500">Subscription</dt>
              <dd className="mt-1 text-gray-900">Free / none</dd>
            </div>
          )}
        </dl>
      </DetailSection>

      {user.isExpert && user.verification ? (
        <DetailSection title="Expert profile">
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Professional title</dt>
              <dd className="mt-1 text-gray-900">{user.verification.professionalTitle || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Experience</dt>
              <dd className="mt-1 text-gray-900">{user.verification.yearsOfExperience || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">License number</dt>
              <dd className="mt-1 text-gray-900">{user.verification.licenseNumber || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Bio</dt>
              <dd className="mt-1 whitespace-pre-wrap text-gray-900">{user.verification.bio || '—'}</dd>
            </div>
          </dl>
        </DetailSection>
      ) : null}

      <DetailSection title="Quick edit">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
            <input className={DETAIL_INPUT_CLASS} value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input className={DETAIL_INPUT_CLASS} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Avatar URL</label>
            <input className={DETAIL_INPUT_CLASS} value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <Select value={role} onChange={setRole} options={[...ADMIN_BASE_ROLE_OPTIONS]} aria-label="User role" />
          </div>
          {role === 'parent' ? (
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isExpert}
                  onChange={e => setIsExpert(e.target.checked)}
                  className="rounded border-pink-300 text-pink-600 focus:ring-pink-400"
                />
                Parent + Expert
              </label>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={saveProfile} disabled={saving} className={ADMIN_BTN_PRIMARY}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </DetailSection>

      <DetailSection title="Linked babies">
        {babies.length === 0 ? (
          <p className="text-sm text-gray-500">No baby profiles linked to this user.</p>
        ) : (
          <ul className="divide-y divide-pink-50">
            {babies.map(b => (
              <li key={b.linkId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-pink-200 bg-pink-50">
                  {b.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.avatarUrl} alt={b.name} className="h-full w-full object-cover" />
                  ) : (
                    <FaBaby className="text-pink-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {b.relationship}
                    {b.isPrimary ? ' • Primary' : ''}
                    {b.accessLevel ? ` • ${b.accessLevel.replace('_', ' ')}` : ''}
                    {' • '}
                    {b.invitationStatus}
                  </p>
                </div>
                {!b.isActive ? <AdminBadge tone="gray">Inactive</AdminBadge> : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Recent recordings">
        {recentRecordings.length === 0 ? (
          <p className="text-sm text-gray-500">No recordings from this user.</p>
        ) : (
          <ul className="space-y-2">
            {recentRecordings.map(r => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-pink-100 bg-pink-50/30 px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-900">{r.babyName}</span>
                <span className="text-gray-600">{formatDate(r.recordedAt)}</span>
                <span className="text-xs text-gray-500 capitalize">{r.processingStatus || 'unknown'}</span>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Account actions">
        <div className="space-y-4">
          {!user.suspended ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Suspension reason (optional)</label>
              <input
                className={DETAIL_INPUT_CLASS}
                value={suspensionReason}
                onChange={e => setSuspensionReason(e.target.value)}
                placeholder="Reason shown to the user when suspended"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actionLoading || saving}
              onClick={() => void toggleSuspend()}
              className={
                user.suspended
                  ? 'rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50'
                  : 'rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50'
              }
            >
              {user.suspended ? 'Reactivate account' : 'Suspend account'}
            </button>
            <Link
              href="/dashboard/admin/subscriptions"
              className="rounded-lg border border-pink-200 px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50"
            >
              Manage subscription
            </Link>
          </div>
        </div>
      </DetailSection>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete user permanently?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  This will remove <strong>{user.fullName}</strong> and their auth account. This action cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void deleteUser()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting…' : 'Delete user'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
