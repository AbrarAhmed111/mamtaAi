'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Dashboard/Sidebar'
import DashboardHeader from '@/components/Dashboard/DashboardHeader'
import { useAuth } from '@/lib/supabase/context'
import { supabase } from '@/lib/supabase/client'
import { playNotificationBeep } from '@/lib/notification-feedback'

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
  actionData?: {
    inviteToken?: string
    babyName?: string
    relationship?: string
  } | null
}

function mapDbRowToAppNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    isRead: !!row.is_read,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    actionData: (row.action_data as AppNotification['actionData']) ?? null,
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [inviteActionLoading, setInviteActionLoading] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationBlink, setNotificationBlink] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const unreadSnapshotRef = useRef(0)

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev)

  const applyNotificationPayload = useCallback((data: { items?: unknown[]; unreadCount?: number }) => {
    const items = Array.isArray(data?.items) ? data.items : []
    const u = Number(data?.unreadCount ?? 0)
    setNotifications(items as AppNotification[])
    setUnreadCount(u)
    unreadSnapshotRef.current = u
  }, [])

  const fetchNotifications = useCallback(async (): Promise<number | null> => {
    const res = await fetch('/api/notifications', { cache: 'no-store' })
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
        const res = await fetch('/api/invites/pending', { cache: 'no-store' })
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
        if (u != null && u > 0) setNotificationBlink(true)
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
        const res = await fetch('/api/notifications', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return
        const newUnread = Number(data?.unreadCount ?? 0)
        if (newUnread > before) {
          playNotificationBeep()
          setNotificationBlink(true)
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
          setNotificationBlink(true)
          playNotificationBeep()
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
      const res = await fetch(`/api/invites/${token}`, {
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

  const handleNotificationClick = async () => {
    const next = !notificationsOpen
    setNotificationsOpen(next)
    if (next) {
      setNotificationBlink(false)
      try {
        await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      } catch {
        // ignore
      }
    }
  }

  const openInviteFromNotification = async (n: AppNotification) => {
    const token = n?.actionData?.inviteToken
    if (!token) return
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: n.id }),
      })
    } catch {}
    try {
      const res = await fetch('/api/invites/pending', { cache: 'no-store' })
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex">
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
        isOpen={isMobileMenuOpen}
        onToggle={toggleMobileMenu}
      />

      <div className="flex-1 flex flex-col lg:ml-64">
        <DashboardHeader
          greeting={getGreeting()}
          userName={displayUser.name.split(' ')[0]}
          userAvatarUrl={displayUser.avatar}
          isLoading={loading}
          onMenuToggle={toggleMobileMenu}
          unreadNotificationCount={unreadCount}
          notificationBlink={notificationBlink}
          onNotificationClick={handleNotificationClick}
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

        {notificationsOpen && (
          <div className="absolute right-4 sm:right-6 top-20 z-[65] w-[92vw] max-w-sm rounded-xl border border-pink-100 bg-white shadow-xl">
            <div className="p-3 border-b border-pink-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
              ) : (
                notifications.map(n => {
                  const isInvite = n?.actionData?.inviteToken
                  return (
                    <button
                      key={n.id}
                      onClick={() => (isInvite ? openInviteFromNotification(n) : setNotificationsOpen(false))}
                      className={`w-full text-left p-3 border-b border-pink-50 hover:bg-pink-50/40 ${n.isRead ? 'bg-white' : 'bg-pink-50/50'}`}
                    >
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{n.body}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        <div className="flex-1 p-4 sm:p-6 w-full">{children}</div>
      </div>
    </div>
  )
}


