'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/Dashboard/Sidebar'
import DashboardHeader from '@/components/Dashboard/DashboardHeader'
import { useAuth } from '@/lib/supabase/context'
import { supabase } from '@/lib/supabase/client'
import { playNotificationBeep } from '@/lib/notification-feedback'
import {
  getInAppAlertFlagsForNotificationRow,
  parseNotificationPreferences,
} from '@/lib/notification-preferences'
import {
  hasUnreadStickyExpertReviewNotifications,
  isStickyExpertReviewNotification,
} from '@/lib/notifications/sticky-expert-notifications'
import { SubscriptionProvider } from '@/hooks/useSubscription'
import {
  getActiveView,
  getAdminDashboardViewPreference,
  getExpertViewPreference,
  getSidebarView,
  isAdminAccount,
  isVerifiedExpert,
} from '@/lib/expert/active-view'
import ExpertViewSwitcher from '@/components/Dashboard/Expert/ExpertViewSwitcher'
import AdminViewSwitcher from '@/components/Dashboard/Admin/AdminViewSwitcher'
import ExpertApplicationBanner from '@/components/Dashboard/Expert/ExpertApplicationBanner'
import DashboardSessionReconcile from '@/components/Dashboard/DashboardSessionReconcile'
import { dashboardFetch } from '@/lib/session/client'

type PendingInvite = {
  id: string
  token: string
  babyName: string
  relationship: string
}

type AppNotification = {
  id: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
  actionUrl?: string | null
  actionData?: {
    inviteToken?: string
    babyName?: string
    relationship?: string
    threadId?: string
    postId?: string
    kind?: string
  } | null
}

function mapDbRowToAppNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    isRead: !!row.is_read,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    actionUrl: row.action_url != null ? String(row.action_url) : null,
    actionData: (row.action_data as AppNotification['actionData']) ?? null,
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [inviteActionLoading, setInviteActionLoading] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationBlink, setNotificationBlink] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const unreadSnapshotRef = useRef(0)

  const notificationPrefs = useMemo(
    () => parseNotificationPreferences(user?.profile?.metadata),
    [user?.profile?.metadata],
  )
  const notificationPrefsRef = useRef(notificationPrefs)
  notificationPrefsRef.current = notificationPrefs

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev)

  const applyNotificationPayload = useCallback((data: { items?: unknown[]; unreadCount?: number }) => {
    const items = Array.isArray(data?.items) ? data.items : []
    const u = Number(data?.unreadCount ?? 0)
    setNotifications(items as AppNotification[])
    setUnreadCount(u)
    unreadSnapshotRef.current = u
    if (notificationPrefsRef.current.highlightBell) {
      setNotificationBlink(
        u > 0 || hasUnreadStickyExpertReviewNotifications(items as AppNotification[]),
      )
    }
  }, [])

  const fetchNotifications = useCallback(async (): Promise<number | null> => {
    const res = await dashboardFetch('/api/notifications', { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return null
    applyNotificationPayload(data)
    return Number(data?.unreadCount ?? 0)
  }, [applyNotificationPayload])

  const displayUser = {
    name: user?.profile?.full_name || 'User',
    role: (user?.profile?.role as string) || 'parent',
    avatar: user?.profile?.avatar_url || undefined,
  }

  const activeView = getActiveView(user?.profile ?? null)
  const sidebarView = getSidebarView(user?.profile ?? null, pathname)
  const verifiedExpert = isVerifiedExpert(user?.profile ?? null)
  const adminAccount = isAdminAccount(user?.profile ?? null)
  const expertViewPreference = getExpertViewPreference(user?.profile ?? null)
  const adminViewPreference = getAdminDashboardViewPreference(user?.profile ?? null)
  const showParentApplicationBanner =
    activeView === 'parent' && !adminAccount && displayUser.role !== 'admin'

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    if (hour < 22) return 'Good Evening'
    return 'Good Night'
  }

  useEffect(() => {
    const loadPendingInvites = async () => {
      if (!user?.id || loading) return
      try {
        const res = await dashboardFetch('/api/invites/pending', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return
        setPendingInvites(Array.isArray(data?.invites) ? data.invites : [])
      } catch {
        // ignore invite prompt failures
      }
    }
    void loadPendingInvites()
  }, [user?.id, loading])

  useEffect(() => {
    if (!user?.id || loading) return
    void (async () => {
      try {
        const u = await fetchNotifications()
        if (u != null && u > 0 && notificationPrefsRef.current.highlightBell) {
          setNotificationBlink(true)
        }
      } catch {
        // ignore
      }
    })()
  }, [user?.id, loading, fetchNotifications])

  useEffect(() => {
    unreadSnapshotRef.current = unreadCount
  }, [unreadCount])

  /** Polling fallback when Realtime is misconfigured or connection drops. */
  useEffect(() => {
    if (!user?.id || loading) return
    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      const before = unreadSnapshotRef.current
      try {
        const res = await dashboardFetch('/api/notifications', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return
        const newUnread = Number(data?.unreadCount ?? 0)
        if (newUnread > before) {
          const p = notificationPrefsRef.current
          if (p.inAppSound) playNotificationBeep()
          if (p.highlightBell) setNotificationBlink(true)
        }
        applyNotificationPayload(data)
      } catch {
        // ignore
      }
    }
    const interval = window.setInterval(() => void tick(), 30_000)
    return () => window.clearInterval(interval)
  }, [user?.id, loading, applyNotificationPayload])

  useEffect(() => {
    if (!user?.id || loading) return

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        payload => {
          const row = payload.new as Record<string, unknown> | null
          if (!row || String(row.user_id) !== user.id) return

          const incoming = mapDbRowToAppNotification(row)
          setNotifications(prev => {
            if (prev.some(n => n.id === incoming.id)) return prev
            return [incoming, ...prev].slice(0, 30)
          })
          if (!incoming.isRead) {
            setUnreadCount(c => {
              const next = c + 1
              unreadSnapshotRef.current = next
              return next
            })
          }
          const flags = getInAppAlertFlagsForNotificationRow(row, notificationPrefsRef.current)
          if (flags.highlight) setNotificationBlink(true)
          if (flags.sound) playNotificationBeep()
          void fetchNotifications()
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[notifications] Realtime channel error; using poll fallback until connection recovers')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, loading, fetchNotifications])

  const handleInviteAction = async (token: string, action: 'accept' | 'withdraw') => {
    try {
      setInviteActionLoading(true)
      const res = await dashboardFetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) return
      setPendingInvites(prev => prev.filter(invite => invite.token !== token))
    } finally {
      setInviteActionLoading(false)
    }
  }

  const activeInvite = pendingInvites[0]

  useEffect(() => {
    if (!adminAccount || !pathname?.startsWith('/dashboard/admin/experts')) return
    void (async () => {
      try {
        await dashboardFetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expertReviewQueueViewed: true }),
        })
        await fetchNotifications()
      } catch {
        // ignore
      }
    })()
  }, [adminAccount, pathname, fetchNotifications])

  const handleNotificationClick = async () => {
    const next = !notificationsOpen
    setNotificationsOpen(next)
    if (next) {
      try {
        await dashboardFetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        await fetchNotifications()
      } catch {
        // ignore
      }
    }
  }

  const openInviteFromNotification = async (n: AppNotification) => {
    const token = n?.actionData?.inviteToken
    if (!token) return
    try {
      await dashboardFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: n.id }),
      })
    } catch {}
    try {
      const res = await dashboardFetch('/api/invites/pending', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      const invites = Array.isArray(data?.invites) ? data.invites : []
      setPendingInvites(invites)
      const match = invites.find((inv: PendingInvite) => inv.token === token)
      if (match) {
        setPendingInvites(prev => {
          const others = prev.filter(i => i.token !== token)
          return [match, ...others]
        })
      }
    } finally {
      setNotificationsOpen(false)
    }
  }

  const handleNotificationListItemClick = async (n: AppNotification) => {
    if (n?.actionData?.inviteToken) {
      await openInviteFromNotification(n)
      return
    }
    if (n.actionUrl) {
      const isStickyExpert = isStickyExpertReviewNotification(n.actionData)
      if (!isStickyExpert) {
        try {
          await dashboardFetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: n.id }),
          })
        } catch {
          // ignore
        }
        if (!n.isRead) {
          setUnreadCount(c => Math.max(0, c - 1))
          unreadSnapshotRef.current = Math.max(0, unreadSnapshotRef.current - 1)
        }
        setNotifications(prev => prev.map(x => (x.id === n.id ? { ...x, isRead: true } : x)))
      }
      setNotificationsOpen(false)
      const path = n.actionUrl.startsWith('/') ? n.actionUrl : `/${n.actionUrl}`
      router.push(path)
      return
    }
    setNotificationsOpen(false)
  }

  return (
    <SubscriptionProvider>
    <DashboardSessionReconcile />
    <div className="h-[100dvh] overflow-hidden bg-[#fdf4f6] p-3 sm:p-4 lg:p-6">
      <div className="mx-auto flex h-full max-h-full max-w-[1600px] items-stretch gap-3 sm:gap-4 lg:gap-6">
      {activeInvite && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-pink-100 bg-white shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900">Family Invite Pending</h3>
            <p className="mt-2 text-sm text-gray-700">
              You received an invite to access <span className="font-semibold text-pink-600">{activeInvite.babyName}</span> as{' '}
              <span className="font-semibold capitalize">{activeInvite.relationship}</span>.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleInviteAction(activeInvite.token, 'accept')}
                disabled={inviteActionLoading}
                className="px-4 py-2 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
              >
                {inviteActionLoading ? 'Please wait...' : 'Accept'}
              </button>
              <button
                onClick={() => handleInviteAction(activeInvite.token, 'withdraw')}
                disabled={inviteActionLoading}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar
        currentPath={pathname || '/dashboard'}
        user={displayUser}
        activeView={sidebarView}
        isOpen={isMobileMenuOpen}
        onToggle={toggleMobileMenu}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-pink-100/80 bg-white shadow-lg shadow-pink-100/30">
        <div className="relative z-40 shrink-0 overflow-visible">
        <DashboardHeader
          greeting={getGreeting()}
          userName={displayUser.name.split(' ')[0]}
          userAvatarUrl={displayUser.avatar}
          isLoading={loading}
          showPlanBadge={activeView === 'parent'}
          headerExtra={
            adminAccount ? (
              <AdminViewSwitcher activeView={adminViewPreference} />
            ) : verifiedExpert ? (
              <ExpertViewSwitcher activeView={expertViewPreference} />
            ) : null
          }
          onMenuToggle={toggleMobileMenu}
          unreadNotificationCount={unreadCount}
          notificationBlink={notificationBlink}
          onNotificationClick={handleNotificationClick}
          notificationDropdown={
            notificationsOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close notifications"
                  className="fixed inset-0 z-[64] bg-black/25 sm:hidden"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="fixed left-3 right-3 top-24 z-[65] flex max-h-[min(24rem,calc(100dvh-6.5rem))] flex-col overflow-hidden rounded-xl border border-pink-100 bg-white shadow-xl sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(92vw,24rem)] sm:max-h-[min(24rem,calc(100vh-7rem))]">
                  <div className="flex shrink-0 items-center justify-between border-b border-pink-100 p-3">
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
                    ) : (
                      notifications.map(n => {
                        const isInvite = Boolean(n?.actionData?.inviteToken)
                        const isLink = isInvite || Boolean(n.actionUrl)
                        const isStickyExpert =
                          !n.isRead && isStickyExpertReviewNotification(n.actionData)
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => void handleNotificationListItemClick(n)}
                            className={`w-full border-b border-pink-50 p-3 text-left hover:bg-pink-50/40 ${
                              isStickyExpert
                                ? 'bg-pink-50 ring-2 ring-inset ring-pink-300 animate-bell-alert'
                                : n.isRead
                                  ? 'bg-white'
                                  : 'bg-pink-50/50'
                            } ${isLink ? 'cursor-pointer' : ''}`}
                          >
                            <p className="text-sm font-medium text-gray-900 break-words">{n.title}</p>
                            <p className="mt-1 text-xs text-gray-600 break-words">{n.body}</p>
                            {isStickyExpert ? (
                              <p className="mt-1 text-[11px] font-medium text-pink-600">
                                Review required — open Expert Verification
                              </p>
                            ) : null}
                            <p className="mt-1 text-[11px] text-gray-500">{new Date(n.createdAt).toLocaleString()}</p>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            ) : null
          }
          onSettingsClick={() => {
            window.location.href = '/dashboard/settings'
          }}
          onSignOut={async () => {
            try {
              await signOut()
            } finally {
              window.location.href = '/welcome'
            }
          }}
        />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
          {showParentApplicationBanner && pathname !== '/dashboard' ? (
            <ExpertApplicationBanner />
          ) : null}
          {children}
        </main>
        </div>
      </div>
      </div>
    </div>
    </SubscriptionProvider>
  )
}


