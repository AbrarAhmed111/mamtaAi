'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type InviteData = {
  id: string
  babyId: string
  babyName: string
  email: string
  relationship: string
  status: 'waiting' | 'approved' | 'withdrawn'
  isExpired: boolean
}

export default function InvitePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = params?.token
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [error, setError] = useState('')
  const [loggedInUser, setLoggedInUser] = useState<{ email: string; name?: string } | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const returnUrl = useMemo(() => (typeof window !== 'undefined' ? window.location.href : ''), [])

  useEffect(() => {
    const run = async () => {
      if (!token) return
      try {
        setLoading(true)
        const res = await fetch(`/api/invites/${token}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data?.error || 'Invite not found')
          return
        }
        setInvite(data.invite)
        setIsRegistered(Boolean(data.isRegistered))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [token])

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user
      if (!user) {
        setLoggedInUser(null)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      setLoggedInUser({
        email: user.email || '',
        name: profile?.full_name || undefined,
      })
    }

    loadUser()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        window.location.href = window.location.pathname
      }
    } finally {
      setLoggingOut(false)
    }
  }

  const submitAction = async (action: 'accept' | 'withdraw') => {
    if (!token) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        router.push(`/welcome?returnUrl=${encodeURIComponent(returnUrl)}`)
        return
      }
      if (!res.ok) {
        setError(data?.error || 'Failed to process invite')
        return
      }
      if (action === 'accept') {
        router.push('/dashboard/babies')
      } else {
        setInvite(prev => (prev ? { ...prev, status: 'withdrawn' } : prev))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Loading invite...</div>
  }

  if (!invite) {
    return <div className="min-h-[60vh] flex items-center justify-center text-red-600">{error || 'Invite not found'}</div>
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-pink-100 bg-white shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Family Invitation</h1>
        <p className="mt-2 text-sm text-gray-600">
          You are invited to access updates for <span className="font-semibold text-pink-600">{invite.babyName}</span>.
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Invited as: <span className="font-medium capitalize">{invite.relationship}</span>
        </p>

        {invite.isExpired && <p className="mt-4 text-sm text-red-600">This invitation has expired.</p>}
        {invite.status === 'withdrawn' && <p className="mt-4 text-sm text-red-600">This invitation was withdrawn.</p>}
        {invite.status === 'approved' && <p className="mt-4 text-sm text-green-600">This invitation is already approved.</p>}

        {!invite.isExpired && invite.status === 'waiting' && (
          <>
            {loggedInUser ? (
              <div className="mt-5 rounded-xl bg-green-50 border border-green-100 p-4">
                <p className="text-sm text-green-900 font-medium">Logged in account</p>
                <p className="text-sm text-gray-800 mt-1">{loggedInUser.name || 'User'}</p>
                <p className="text-xs text-gray-600">{loggedInUser.email}</p>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-3 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-pink-50 border border-pink-100 p-4 text-sm text-gray-700">
                {isRegistered
                  ? 'You are invited, login to continue.'
                  : 'You are invited, sign up to access the dashboard.'}
              </div>
            )}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              {!loggedInUser && (
                <button
                  onClick={() => router.push(`/welcome?returnUrl=${encodeURIComponent(returnUrl)}`)}
                  className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
                >
                  {isRegistered ? 'Login to continue' : 'Sign up to continue'}
                </button>
              )}
              <button
                onClick={() => submitAction('accept')}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-pink-300 text-pink-700 hover:bg-pink-50 disabled:opacity-60"
              >
                Accept Invite
              </button>
              <button
                onClick={() => submitAction('withdraw')}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Withdraw
              </button>
            </div>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
