'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  FaArrowRight,
  FaCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaRedo,
  FaShieldAlt,
  FaStar,
} from 'react-icons/fa'
import LandingNav from '@/components/marketing/LandingNav'
import { useAuth } from '@/lib/supabase/context'

type Status = 'confirming' | 'success' | 'error'

const PLAN_LABELS: Record<string, string> = {
  plus: 'Plus',
  pro: 'Pro',
}

function planDisplayName(slug: string | null | undefined) {
  if (!slug) return 'your new plan'
  return PLAN_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)
}

function BillingSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<Status>('confirming')
  const [planSlug, setPlanSlug] = useState<string | null>(searchParams.get('plan'))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [redirectSeconds, setRedirectSeconds] = useState(3)

  const checkoutSessionId =
    searchParams.get('checkout_session') || searchParams.get('session_id')

  const confirmCheckout = useCallback(async () => {
    if (!checkoutSessionId) return false

    const res = await fetch('/api/billing/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutSessionId }),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setErrorMessage(
        typeof data.error === 'string' ? data.error : 'Could not confirm your subscription',
      )
      setStatus('error')
      return false
    }

    if (data.planSlug) setPlanSlug(String(data.planSlug))
    setStatus('success')
    return true
  }, [checkoutSessionId])

  useEffect(() => {
    if (loading) return

    if (!checkoutSessionId) {
      router.replace('/dashboard/settings?billing=success#billing')
      return
    }

    if (!user) {
      const returnUrl = `/billing/success?checkout_session=${encodeURIComponent(checkoutSessionId)}`
      router.replace(`/welcome?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    let cancelled = false
    void (async () => {
      if (cancelled) return
      await confirmCheckout()
    })()

    return () => {
      cancelled = true
    }
  }, [checkoutSessionId, confirmCheckout, loading, router, user])

  useEffect(() => {
    if (status !== 'success') return

    setRedirectSeconds(3)
    const tick = window.setInterval(() => {
      setRedirectSeconds(s => (s <= 1 ? 0 : s - 1))
    }, 1000)

    const redirect = window.setTimeout(() => {
      router.replace('/dashboard/settings?billing=success#billing')
    }, 3000)

    return () => {
      window.clearInterval(tick)
      window.clearTimeout(redirect)
    }
  }, [router, status])

  const planName = planDisplayName(planSlug)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <LandingNav />

      <main className="relative overflow-hidden pt-28 pb-20 px-4 sm:px-6">
        <div className="absolute -top-8 right-0 w-72 h-72 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-40 animate-pulse" />

        <div className="relative max-w-lg mx-auto animate-fade-in">
          <div className="rounded-3xl border border-pink-100/80 bg-white/95 backdrop-blur-sm shadow-2xl shadow-pink-100/50 overflow-hidden">
            {/* Top accent bar */}
            <div
              className={`h-1.5 w-full ${
                status === 'success'
                  ? 'bg-gradient-to-r from-emerald-400 via-pink-500 to-purple-500'
                  : status === 'error'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                    : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 animate-pulse'
              }`}
            />

            <div className="p-8 sm:p-10 text-center">
              {status === 'confirming' && (
                <>
                  <div className="relative mx-auto w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 animate-ping opacity-40" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-200/60">
                      <div className="h-9 w-9 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    Activating your plan
                  </h1>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    Thanks for subscribing! We&apos;re syncing your {planName} benefits now.
                  </p>
                  <ul className="mt-8 space-y-3 text-left max-w-xs mx-auto">
                    {[
                      { label: 'Payment received', done: true },
                      { label: 'Updating your account', done: false, active: true },
                      { label: 'Unlocking features', done: false },
                    ].map(step => (
                      <li
                        key={step.label}
                        className={`flex items-center gap-3 text-sm ${
                          step.done ? 'text-emerald-700' : step.active ? 'text-pink-700' : 'text-gray-400'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            step.done
                              ? 'bg-emerald-100'
                              : step.active
                                ? 'bg-pink-100'
                                : 'bg-gray-100'
                          }`}
                        >
                          {step.done ? (
                            <FaCheck className="h-3.5 w-3.5 text-emerald-600" />
                          ) : step.active ? (
                            <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-gray-300" />
                          )}
                        </span>
                        {step.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="relative mx-auto w-24 h-24 mb-6 animate-fade-in">
                    <div className="absolute -top-2 -right-2 text-amber-400 animate-float">
                      <FaStar className="h-5 w-5" />
                    </div>
                    <div className="absolute -bottom-1 -left-2 text-pink-400 animate-float-delayed">
                      <FaStar className="h-4 w-4" />
                    </div>
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-xl shadow-emerald-200/60 ring-4 ring-emerald-50">
                      <FaCheckCircle className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-200 px-4 py-1.5 text-sm font-semibold text-pink-700 mb-4">
                    <FaShieldAlt className="h-3.5 w-3.5" />
                    Payment successful
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    Welcome to{' '}
                    <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
                      MumtaAI {planName}
                    </span>
                  </h1>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    Your subscription is active. Higher limits, insights, and family features are
                    ready to use.
                  </p>
                  <p className="mt-6 text-xs text-gray-500">
                    Redirecting to billing settings in{' '}
                    <span className="font-semibold text-pink-600">{redirectSeconds}</span>s…
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/dashboard/settings?billing=success#billing"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-pink-600 hover:to-rose-600 hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                      View billing & plan
                      <FaArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-pink-100 bg-white px-6 py-3 text-sm font-semibold text-gray-800 hover:border-pink-200 hover:bg-pink-50/50 transition-all"
                    >
                      Go to dashboard
                    </Link>
                  </div>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 ring-4 ring-amber-100/80 mb-6">
                    <FaExclamationTriangle className="h-10 w-10 text-amber-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Almost there</h1>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    Your payment went through, but we couldn&apos;t finish syncing your plan yet.
                  </p>
                  {errorMessage && (
                    <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      {errorMessage}
                    </p>
                  )}
                  <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStatus('confirming')
                        setErrorMessage(null)
                        void confirmCheckout()
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-pink-600 hover:to-rose-600 transition-all"
                    >
                      <FaRedo className="h-3.5 w-3.5" />
                      Try again
                    </button>
                    <Link
                      href="/dashboard/settings#billing"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      Open billing settings
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500 max-w-sm mx-auto">
            Questions about your subscription? Manage invoices and cancellation anytime from billing
            settings.
          </p>
        </div>
      </main>
    </div>
  )
}

function BillingSuccessFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <LandingNav />
      <main className="flex items-center justify-center pt-32 px-4">
        <div className="max-w-lg w-full rounded-3xl border border-pink-100 bg-white shadow-xl p-10 text-center animate-fade-in">
          <div className="mx-auto h-12 w-12 rounded-full border-2 border-pink-200 border-t-pink-600 animate-spin" />
          <p className="mt-4 text-sm font-medium text-gray-600">Loading…</p>
        </div>
      </main>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<BillingSuccessFallback />}>
      <BillingSuccessContent />
    </Suspense>
  )
}
