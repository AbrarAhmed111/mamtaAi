'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
  FaCreditCard,
  FaIdCard,
  FaUserShield,
  FaUserCheck,
  FaTicketAlt,
  FaFlag,
  FaClipboardList,
  FaUserMd,
} from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Select from '@/components/ui/select'
import type { Json } from '@/types/supabase'
import { useAuth } from '@/lib/supabase/context'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  parseNotificationPreferences,
} from '@/lib/notification-preferences'
import { useSubscription } from '@/hooks/useSubscription'
import { useBilling } from '@/hooks/useBilling'
import { isVerifiedExpert } from '@/lib/expert/active-view'
interface Profile {
  id: string
  full_name: string
  phone_number: string | null
  avatar_url: string | null
  role: string | null
  is_expert?: boolean | null
  is_verified?: boolean | null
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

const PARENT_SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: FaUser },
  { id: 'billing', label: 'Billing & plan', icon: FaCreditCard },
  { id: 'notifications', label: 'Notifications', icon: FaBell },
  { id: 'professional', label: 'Professional', icon: FaUserMd },
  { id: 'family', label: 'Family access', icon: FaUsers },
  { id: 'account', label: 'Account', icon: FaIdCard },
] as const

const ADMIN_SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: FaUser },
  { id: 'notifications', label: 'Notifications', icon: FaBell },
  { id: 'admin', label: 'Admin panel', icon: FaUserShield },
  { id: 'account', label: 'Account', icon: FaIdCard },
] as const

const ADMIN_PANEL_LINKS = [
  { href: '/dashboard/admin/users', label: 'Users', description: 'Manage platform accounts', icon: FaUserShield, tone: 'pink' },
  { href: '/dashboard/admin/experts', label: 'Expert verification', description: 'Review pending applications', icon: FaUserCheck, tone: 'emerald' },
  { href: '/dashboard/admin/subscriptions', label: 'Subscriptions', description: 'Plans and billing overrides', icon: FaCreditCard, tone: 'purple' },
  { href: '/dashboard/admin/coupons', label: 'Coupons', description: 'Discount codes', icon: FaTicketAlt, tone: 'amber' },
  { href: '/dashboard/admin/moderation', label: 'Moderation', description: 'Community reports queue', icon: FaFlag, tone: 'rose' },
  { href: '/dashboard/admin/logs', label: 'System logs', description: 'Audit and error logs', icon: FaClipboardList, tone: 'gray' },
] as const

type SettingsTabId =
  | (typeof PARENT_SETTINGS_TABS)[number]['id']
  | (typeof ADMIN_SETTINGS_TABS)[number]['id']

const ADMIN_TONE_CLASSES = {
  pink: 'bg-pink-100 text-pink-600 group-hover:bg-pink-200',
  emerald: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200',
  purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
  amber: 'bg-amber-100 text-amber-600 group-hover:bg-amber-200',
  rose: 'bg-rose-100 text-rose-600 group-hover:bg-rose-200',
  gray: 'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
} as const

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

function ProfessionalSettingsPanel({ profile }: { profile: Profile | null }) {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none')
  const [canApply, setCanApply] = useState(true)
  const [reapplyAt, setReapplyAt] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/experts/apply', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          setStatus(data.status || 'none')
          setCanApply(Boolean(data.canApply))
          setReapplyAt(data.reapplyAt ?? null)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const isVerifiedExpertUser = isVerifiedExpert(profile)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-sm text-gray-500">
        Loading professional settings…
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <FaUserMd className="text-pink-600" />
        Professional / Expert program
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Healthcare professionals can apply to join the MamtaAI expert network, publish guidance, and appear in the
        expert directory.
      </p>

      {isVerifiedExpertUser ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5">
          <p className="font-semibold text-emerald-900">You are a verified expert</p>
          <p className="mt-2 text-sm text-emerald-800">
            Use the header toggle to switch between Parent and Expert dashboard views. Edit your public listing anytime.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/expert/profile"
              className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Edit expert profile
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
            >
              Go to expert overview
            </Link>
          </div>
        </div>
      ) : status === 'pending' ? (
        <div className="rounded-xl border border-pink-100/80 bg-gradient-to-br from-pink-50 via-rose-50/90 to-white p-5 shadow-sm shadow-pink-100/20">
          <p className="font-semibold text-gray-900">Application under review</p>
          <p className="mt-2 text-sm text-gray-600">
            Your documents are being reviewed. You can continue using MamtaAI as a parent while you wait.
          </p>
        </div>
      ) : status === 'rejected' ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-5">
          <p className="font-semibold text-rose-900">Application not approved</p>
          <p className="mt-2 text-sm text-rose-800">
            {canApply
              ? 'You may submit a new application.'
              : reapplyAt
                ? `Re-apply after ${new Date(reapplyAt).toLocaleString()}.`
                : 'Please contact support for assistance.'}
          </p>
          {canApply ? (
            <Link
              href="/dashboard/expert-application"
              className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Re-apply as expert
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-5">
          <p className="font-semibold text-gray-900">Become an expert on MamtaAI</p>
          <p className="mt-2 text-sm text-gray-600">
            Submit your credentials and a verification document. Approval typically takes 1–3 business days.
          </p>
          <Link
            href="/dashboard/expert-application"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700"
          >
            <FaUserMd />
            Start expert application
          </Link>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const isAdmin = user?.profile?.role === 'admin'
  const settingsTabs = useMemo(
    () => (isAdmin ? ADMIN_SETTINGS_TABS : PARENT_SETTINGS_TABS),
    [isAdmin],
  )
  const validTabIds = useMemo(() => settingsTabs.map(t => t.id), [settingsTabs])
  const {
    slug,
    planName,
    meters,
    limitations,
    loading: subLoading,
    refresh: refreshSubscription,
  } = useSubscription()
  const { loadingPlan, portalLoading, startCheckout, openPortal } = useBilling()
  const [billingLoaded, setBillingLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile')
  const tabContentRef = useRef<HTMLDivElement>(null)

  const selectTab = (id: SettingsTabId) => {
    setActiveTab(id)
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/dashboard/settings?tab=${id}`)
      // Wait for the new panel to render, then gently scroll it into view.
      requestAnimationFrame(() => {
        tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }
  const [billingMeta, setBillingMeta] = useState<{
    canManageBilling: boolean
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: string | null
    pendingPlanChange: { plan_slug: string; effective_at: string } | null
  }>({
    canManageBilling: false,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    pendingPlanChange: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/subscription', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.billing) {
          setBillingMeta({
            canManageBilling: Boolean(data.billing.canManageBilling),
            cancelAtPeriodEnd: Boolean(data.billing.cancelAtPeriodEnd),
            currentPeriodEnd: data.billing.currentPeriodEnd ?? null,
            pendingPlanChange: data.billing.pendingPlanChange ?? null,
          })
        }
      } finally {
        setBillingLoaded(true)
      }
    })()
  }, [slug])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const legacyCheckout = params.get('session_id')
    if (legacyCheckout?.startsWith('cs_')) {
      router.replace(
        `/billing/success?checkout_session=${encodeURIComponent(legacyCheckout)}`,
      )
      return
    }
    const billing = params.get('billing')
    const planParam = params.get('plan')
    const planLabel = planParam ? planParam.charAt(0).toUpperCase() + planParam.slice(1) : 'your new plan'

    // Decide initial tab from the URL: explicit ?tab=, billing redirects, or #billing hash.
    const tabParam = params.get('tab')
    if (tabParam && validTabIds.includes(tabParam as SettingsTabId)) {
      setActiveTab(tabParam as SettingsTabId)
    } else if (!isAdmin && (billing || window.location.hash === '#billing')) {
      setActiveTab('billing')
    } else if (tabParam && !validTabIds.includes(tabParam as SettingsTabId)) {
      setActiveTab('profile')
    }

    if (isAdmin) {
      if (billing === 'success' || billing === 'scheduled' || billing === 'kept') {
        void refreshSubscription()
      }
      return
    }

    if (billing === 'success') {
      toast.success('Your subscription was updated successfully.')
      void refreshSubscription()
      window.history.replaceState({}, '', '/dashboard/settings?tab=billing')
    } else if (billing === 'scheduled') {
      toast.success(
        `You'll switch to ${planLabel} at the end of your current billing period. You keep your current plan until then.`,
      )
      void refreshSubscription()
      window.history.replaceState({}, '', '/dashboard/settings?tab=billing')
    } else if (billing === 'kept') {
      toast.success('Your scheduled plan change was cancelled. You keep your current plan.')
      void refreshSubscription()
      window.history.replaceState({}, '', '/dashboard/settings?tab=billing')
    } else if (billing === 'cancelled') {
      toast.error('Checkout was cancelled.')
      window.history.replaceState({}, '', '/dashboard/settings?tab=billing')
    } else if (billing === 'portal') {
      void refreshSubscription()
      window.history.replaceState({}, '', '/dashboard/settings?tab=billing')
    }
  }, [refreshSubscription, router, isAdmin, validTabIds])
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
    if (profile && !isAdmin) {
      loadStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isAdmin])

  useEffect(() => {
    if (!validTabIds.includes(activeTab)) {
      setActiveTab('profile')
    }
  }, [activeTab, validTabIds])

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

      {/* Tab navigation */}
      <div className="mb-6 border-b border-pink-100 overflow-x-auto no-scroll">
        <nav className="flex gap-1 -mb-px min-w-max" aria-label="Settings sections">
          {settingsTabs.map(tab => {
            const isActive = tab.id === activeTab
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id as SettingsTabId)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-pink-600 text-pink-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                }`}
              >
                <Icon className="text-base" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div ref={tabContentRef} className="space-y-6 scroll-mt-24">
        {/* Billing & plan */}
        {activeTab === 'billing' && !isAdmin && (
        <>
          <div className="bg-white rounded-xl shadow-lg p-6" id="billing">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Billing & plan</h2>
            {subLoading || !billingLoaded ? (
              <div className="animate-pulse" aria-hidden="true">
                <div className="h-4 w-48 rounded bg-gray-100 mb-4" />
                <div className="h-3.5 w-40 rounded bg-gray-100 mb-2" />
                <div className="h-3.5 w-36 rounded bg-gray-100 mb-4" />
                <div className="space-y-1.5 mb-4">
                  <div className="h-3 w-44 rounded bg-gray-100" />
                  <div className="h-3 w-40 rounded bg-gray-100" />
                  <div className="h-3 w-36 rounded bg-gray-100" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="h-9 w-32 rounded-lg bg-gray-100" />
                  <div className="h-9 w-28 rounded-lg bg-gray-100" />
                  <div className="h-9 w-28 rounded-lg bg-gray-100" />
                </div>
              </div>
            ) : (
            <>
            <p className="text-sm text-gray-600 mb-4">
              You&apos;re on <span className="font-semibold capitalize text-pink-700">{planName}</span> ({slug}).
            </p>
            {meters.recordings && meters.recordings.max != null && (
              <p className="text-sm text-gray-700 mb-2">
                {meters.recordings.label}: {meters.recordings.used} / {meters.recordings.max} this month
              </p>
            )}
            {meters.activities && meters.activities.max != null && (
              <p className="text-sm text-gray-700 mb-2">
                {meters.activities.label}: {meters.activities.used} / {meters.activities.max} this month
              </p>
            )}
            <ul className="text-xs text-gray-500 space-y-1 mb-4">
              <li>Max recording length: {limitations.max_recording_duration_seconds}s</li>
              <li>Family invites: {limitations.allow_family_invites ? 'Yes' : 'Not on Free'}</li>
              <li>Insights export: {limitations.allow_insights_export ? 'Yes' : 'Available on Plus'}</li>
            </ul>
            {billingMeta.cancelAtPeriodEnd && billingMeta.currentPeriodEnd && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                Your paid plan ends on{' '}
                {new Date(billingMeta.currentPeriodEnd).toLocaleDateString()}. You will move to Free
                after that.
              </p>
            )}
            {billingMeta.pendingPlanChange && (
              <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                <p>
                  Your plan will switch to{' '}
                  <span className="font-semibold capitalize">
                    {billingMeta.pendingPlanChange.plan_slug}
                  </span>{' '}
                  on {new Date(billingMeta.pendingPlanChange.effective_at).toLocaleDateString()}. You
                  keep your current <span className="font-semibold capitalize">{slug}</span> plan and
                  features until then.
                </p>
                {(slug === 'plus' || slug === 'pro') && (
                  <button
                    type="button"
                    disabled={loadingPlan !== null}
                    onClick={() => {
                      void startCheckout(slug).catch(err =>
                        toast.error(err instanceof Error ? err.message : 'Could not cancel change'),
                      )
                    }}
                    className="mt-2 inline-flex rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                  >
                    {loadingPlan === slug ? 'Cancelling…' : `Keep ${planName} instead`}
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className={
                  slug === 'pro'
                    ? 'inline-flex rounded-lg border border-pink-200 px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50'
                    : 'inline-flex rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700'
                }
              >
                {slug === 'pro' ? 'Compare plans' : 'View plans & upgrade'}
              </Link>
              {billingMeta.canManageBilling && (
                <button
                  type="button"
                  disabled={portalLoading}
                  onClick={() => {
                    void openPortal().catch(err =>
                      toast.error(err instanceof Error ? err.message : 'Could not open portal'),
                    )
                  }}
                  className="inline-flex rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {portalLoading ? 'Opening…' : 'Manage billing'}
                </button>
              )}
              <button
                type="button"
                onClick={() => void refreshSubscription()}
                className="inline-flex rounded-lg border border-pink-200 px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50"
              >
                Refresh usage
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Secure checkout powered by Stripe. Cancel anytime from Manage billing.
            </p>
            </>
            )}
          </div>

        </>
        )}

        {/* Profile Information */}
        {activeTab === 'profile' && (
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
        )}

        {/* Notification preferences */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FaBell className="text-pink-600" />
              Notification preferences
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Choose what we can notify you about. In-app sound and bell highlight apply on the dashboard when new items
              arrive.
              {isAdmin
                ? ' Use the master toggles for all in-app or email delivery, then pick which event types you care about.'
                : ' Family and community toggles control those notification categories.'}
            </p>

            <div className="rounded-lg border border-pink-100 bg-gradient-to-br from-white to-pink-50/20 px-4">
              {isAdmin ? (
                <>
                  <ToggleRow
                    id="pref-admin-alerts"
                    label="Admin panel alerts (in-app)"
                    description="Master switch for bell notifications on the dashboard. Individual alert types below still apply."
                    checked={notifPrefs.adminAlerts}
                    onChange={v => setNotifPrefs(p => ({ ...p, adminAlerts: v }))}
                  />
                  <ToggleRow
                    id="pref-admin-email"
                    label="Email admin alerts"
                    description="Master switch for admin emails. Requires SMTP to be configured on the server."
                    checked={notifPrefs.emailAdminAlerts}
                    onChange={v => setNotifPrefs(p => ({ ...p, emailAdminAlerts: v }))}
                  />

                  <div className="border-t border-pink-100/80 pt-2 mt-1 mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-1 py-2">
                      Alert types
                    </p>
                  </div>

                  <ToggleRow
                    id="pref-admin-signups"
                    label="New parent & user signups"
                    description="When someone registers as a parent or other non-expert role."
                    checked={notifPrefs.adminNotifySignups}
                    onChange={v => setNotifPrefs(p => ({ ...p, adminNotifySignups: v }))}
                  />
                  <ToggleRow
                    id="pref-admin-experts"
                    label="Expert applications"
                    description="New expert signups that need verification."
                    checked={notifPrefs.adminNotifyExperts}
                    onChange={v => setNotifPrefs(p => ({ ...p, adminNotifyExperts: v }))}
                  />
                  <ToggleRow
                    id="pref-admin-subscriptions"
                    label="Subscription & billing"
                    description="New paid plans, upgrades, plan changes, payment failures, cancellations, and scheduled downgrades."
                    checked={notifPrefs.adminNotifySubscriptions}
                    onChange={v => setNotifPrefs(p => ({ ...p, adminNotifySubscriptions: v }))}
                  />
                  <ToggleRow
                    id="pref-admin-moderation"
                    label="Moderation reports"
                    description="Reports on blog posts, forum threads, replies, and comments."
                    checked={notifPrefs.adminNotifyModeration}
                    onChange={v => setNotifPrefs(p => ({ ...p, adminNotifyModeration: v }))}
                  />
                  <ToggleRow
                    id="pref-admin-coupons"
                    label="Coupon redemptions"
                    description="When a user applies a discount code at checkout."
                    checked={notifPrefs.adminNotifyCoupons}
                    onChange={v => setNotifPrefs(p => ({ ...p, adminNotifyCoupons: v }))}
                  />
                  <ToggleRow
                    id="pref-admin-actions"
                    label="Other admins’ actions"
                    description="When another admin updates users, subscriptions, coupons, experts, or moderation."
                    checked={notifPrefs.adminNotifyAdminActions}
                    onChange={v => setNotifPrefs(p => ({ ...p, adminNotifyAdminActions: v }))}
                  />
                  <ToggleRow
                    id="pref-admin-system-errors"
                    label="System errors"
                    description="High and critical errors logged by the application."
                    checked={notifPrefs.adminNotifySystemErrors}
                    onChange={v => setNotifPrefs(p => ({ ...p, adminNotifySystemErrors: v }))}
                  />
                </>
              ) : (
                <>
                  <ToggleRow
                    id="pref-family-invites"
                    label="Family invites"
                    description={"When someone invites you to a baby's care circle."}
                    checked={notifPrefs.familyInvites}
                    onChange={v => setNotifPrefs(p => ({ ...p, familyInvites: v }))}
                  />
                  <ToggleRow
                    id="pref-community"
                    label="Community activity"
                    description="Forum and blog: replies on your threads or posts, replies to your messages, and @mentions (use @ plus a user profile ID)."
                    checked={notifPrefs.community}
                    onChange={v => setNotifPrefs(p => ({ ...p, community: v }))}
                  />
                </>
              )}
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
              </div>
              <p className="text-xs text-gray-500 mb-4">
                SpO₂ and pulse alerts from a connected oximeter. Requires an active oximeter session on a
                Bluetooth-capable browser.
              </p>
              <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4">
                <ToggleRow
                  id="pref-oxi-spo2"
                  label="Low oxygen (SpO₂) alerts"
                  description="Notify when oxygen saturation drops below the attention threshold."
                  checked={notifPrefs.oximeterSpo2}
                  onChange={v => setNotifPrefs(p => ({ ...p, oximeterSpo2: v }))}
                />
                <ToggleRow
                  id="pref-oxi-pulse"
                  label="Heart rate alerts"
                  description="Notify when pulse is unusually high or low."
                  checked={notifPrefs.oximeterPulse}
                  onChange={v => setNotifPrefs(p => ({ ...p, oximeterPulse: v }))}
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
        )}

        {activeTab === 'professional' && !isAdmin && (
          <ProfessionalSettingsPanel profile={profile} />
        )}

        {/* Family access — guardians & relatives */}
        {activeTab === 'family' && !isAdmin && (
          familyLoading && familyBabies.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600" />
                Loading family access…
              </div>
            </div>
          ) : familyBabies.length > 0 ? (
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
                                    <Select
                                      id={`access-${rowKey}`}
                                      value={value}
                                      disabled={updatingMemberKey === rowKey || removingMemberKey === rowKey}
                                      onChange={(next) => {
                                        if (next === value) return
                                        void updateMemberAccess(baby.id, m.parentId, next as 'full' | 'read_only')
                                      }}
                                      options={[
                                        { value: 'read_only', label: 'Read only' },
                                        { value: 'full', label: 'Full access' },
                                      ]}
                                      size="sm"
                                      aria-label={`Access for ${m.fullName}`}
                                    />
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
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 text-sm text-gray-600">
              You don&apos;t manage family access for any child yet. When you add a baby or invite a
              caregiver from a child&apos;s page, they&apos;ll appear here.
            </div>
          ))}

        {activeTab === 'admin' && isAdmin && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
              Admin panel
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Jump to platform management tools. Use the header toggle to preview the app as a parent user,
              or open admin tools from the links below.
            </p>
            <div className="space-y-3">
              {ADMIN_PANEL_LINKS.map(link => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-pink-50 group"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${ADMIN_TONE_CLASSES[link.tone]}`}
                    >
                      <Icon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{link.label}</p>
                      <p className="text-xs text-gray-500">{link.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-6 border-t border-pink-100 pt-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline"
              >
                → Admin overview dashboard
              </Link>
            </div>
          </div>
        )}

          {/* Account Information */}
          {activeTab === 'account' && (
          <>
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
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Role</span>
                <span className="text-sm font-medium capitalize text-gray-900">{profile?.role || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">User ID</span>
                <span className="text-sm font-mono text-gray-500 text-xs">
                  {profile?.id.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          {!isAdmin && (
          <>
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
          </>
          )}

          {isAdmin && (
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl shadow-lg p-6 border border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-3">Administrator</h3>
            <p className="text-sm text-gray-600 mb-4">
              Billing, family access, and subscription limits do not apply to admin accounts. Use the Admin panel tab for
              platform management.
            </p>
            <button
              type="button"
              onClick={() => selectTab('admin')}
              className="text-sm font-medium text-pink-700 hover:text-pink-800 hover:underline"
            >
              → Open admin panel shortcuts
            </button>
          </div>
          )}
        </>
        )}
      </div>
    </div>
  )
}

