'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import LandingNav from '@/components/marketing/LandingNav'
import { useBilling } from '@/hooks/useBilling'
import {
  FaArrowRight,
  FaBaby,
  FaChartLine,
  FaCheck,
  FaChevronDown,
  FaMicrophone,
  FaMinus,
  FaShieldAlt,
  FaStar,
  FaUsers,
} from 'react-icons/fa'
import { PLAN_DEFINITIONS, planRank } from '@/lib/subscription/plans'

const PLAN_CARD_ANIMATION = ['animate-fade-in', 'animate-fade-in-delay-150', 'animate-fade-in-delay-300'] as const
import type { PlanSlug } from '@/lib/subscription/types'
import { useAuth } from '@/lib/supabase/context'
import {
  COMPARISON_ROWS,
  formatComparisonCell,
  PLAN_UI,
  PRICING_FAQ,
} from './pricing-data'

type ApiPlan = {
  slug: string
  name: string
  description: string
  price_usd: number
  is_popular: boolean
  features: string[]
}

function ComparisonCell({ value }: { value: boolean | string }) {
  const cell = formatComparisonCell(value)
  if (cell.type === 'bool') {
    return cell.positive ? (
      <FaCheck className="h-5 w-5 text-emerald-500 mx-auto" aria-label="Included" />
    ) : (
      <FaMinus className="h-4 w-4 text-gray-300 mx-auto" aria-label="Not included" />
    )
  }
  return <span className="text-sm font-medium text-gray-800">{cell.display}</span>
}

function PlanCta({
  slug,
  currentSlug,
  isLoggedIn,
}: {
  slug: PlanSlug
  currentSlug: string
  isLoggedIn: boolean
}) {
  const { loadingPlan, startCheckout } = useBilling()
  const isLoading = loadingPlan === slug

  if (slug === currentSlug) {
    return (
      <span className="flex w-full items-center justify-center rounded-xl border-2 border-pink-200 bg-pink-50 py-3.5 text-sm font-semibold text-pink-800">
        Your current plan
      </span>
    )
  }
  if (slug === 'free') {
    return (
      <Link
        href={isLoggedIn ? '/dashboard' : '/welcome'}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-800 hover:border-pink-200 hover:bg-pink-50/50 transition-all"
      >
        {isLoggedIn ? 'Go to dashboard' : 'Get started free'}
        <FaArrowRight className="h-3.5 w-3.5" />
      </Link>
    )
  }

  const planLabel = slug === 'plus' ? 'Plus' : 'Pro'
  const isDowngradeTarget =
    currentSlug !== 'free' && planRank(slug) < planRank(currentSlug as PlanSlug)

  const gradientClass = isDowngradeTarget
    ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
    : slug === 'plus'
      ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500'

  if (!isLoggedIn) {
    return (
      <Link
        href="/welcome"
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 ${gradientClass}`}
      >
        Sign up to upgrade
        <FaArrowRight className="h-3.5 w-3.5" />
      </Link>
    )
  }

  const idleLabel = isDowngradeTarget ? `Switch to ${planLabel}` : `Upgrade to ${planLabel}`

  return (
    <div>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          void startCheckout(slug).catch(err => {
            toast.error(err instanceof Error ? err.message : 'Checkout failed')
          })
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait ${gradientClass}`}
      >
        {isLoading ? (isDowngradeTarget ? 'Scheduling…' : 'Redirecting to Stripe…') : idleLabel}
        {!isLoading && <FaArrowRight className="h-3.5 w-3.5" />}
      </button>
      {isDowngradeTarget && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Takes effect at the end of your billing period. You keep your current plan until then.
        </p>
      )}
    </div>
  )
}

export default function PricingPage() {
  const { user } = useAuth()
  const [currentSlug, setCurrentSlug] = useState<string>('free')
  const [apiPlans, setApiPlans] = useState<ApiPlan[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/subscription', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setApiPlans(Array.isArray(data.plans) ? data.plans : [])
        setCurrentSlug(data?.plan?.slug || 'free')
      }
    })()
  }, [])

  const orderedSlugs: PlanSlug[] = ['free', 'plus', 'pro']

  const plans = useMemo(() => {
    return orderedSlugs.map(slug => {
      const def = PLAN_DEFINITIONS[slug]
      const api = apiPlans.find(p => p.slug === slug)
      const ui = PLAN_UI[slug]
      return {
        slug,
        name: api?.name ?? def.name,
        description: api?.description ?? def.description,
        price_usd: api?.price_usd ?? def.price_usd,
        is_popular: api?.is_popular ?? def.is_popular,
        features: api?.features ?? def.features,
        ui,
      }
    })
  }, [apiPlans])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <LandingNav activePage="pricing" />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute -top-8 -right-8 w-64 h-64 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute -bottom-8 -left-8 w-56 h-56 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="relative max-w-4xl mx-auto text-center animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-gradient-to-r from-pink-100 to-rose-100 px-4 py-2 text-sm font-semibold text-pink-700 shadow-sm mb-6">
            <FaStar className="text-amber-400" />
            Simple plans for every family
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
            Pricing that grows{' '}
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
              with your family
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Start free with AI cry analysis and daily tracking. Upgrade for more babies, family invites,
            deeper insights, and community publishing.
          </p>
          {user && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white border border-pink-100 px-4 py-2 text-sm text-gray-700 shadow-sm animate-fade-in-delay-150">
              Signed in — current plan:{' '}
              <span className="font-bold capitalize text-pink-700">{currentSlug}</span>
            </p>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-gray-600 animate-fade-in-delay-300">
            <span className="flex items-center gap-2 transition-transform duration-300 hover:-translate-y-0.5">
              <FaShieldAlt className="text-pink-500" /> Secure payments via Stripe
            </span>
            <span className="flex items-center gap-2 transition-transform duration-300 hover:-translate-y-0.5">
              <FaMicrophone className="text-rose-500" /> Cancel anytime
            </span>
            <span className="flex items-center gap-2 transition-transform duration-300 hover:-translate-y-0.5">
              <FaBaby className="text-purple-500" /> No data deleted on downgrade
            </span>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="px-4 pb-20 -mt-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, planIndex) => {
              const isPopular = plan.is_popular
              const isPro = plan.slug === 'pro'
              return (
                <article
                  key={plan.slug}
                  className={`relative flex flex-col rounded-3xl border bg-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${PLAN_CARD_ANIMATION[planIndex]} ${
                    isPopular
                      ? 'border-pink-300 ring-2 ring-pink-200 lg:scale-[1.02] lg:-mt-2 lg:mb-2 z-10'
                      : isPro
                        ? 'border-purple-200'
                        : 'border-gray-100'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                        <FaStar className="h-3 w-3" /> Most popular
                      </span>
                    </div>
                  )}
                  {isPro && !isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                        Best for families
                      </span>
                    </div>
                  )}

                  <div className={`p-8 ${isPopular || isPro ? 'pt-10' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{plan.description}</p>
                      </div>
                      <div
                        className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${plan.ui.iconBg}`}
                      >
                        {plan.slug === 'free' && <FaBaby className="h-6 w-6" />}
                        {plan.slug === 'plus' && <FaUsers className="h-6 w-6" />}
                        {plan.slug === 'pro' && <FaChartLine className="h-6 w-6" />}
                      </div>
                    </div>

                    <div className="mt-8 flex items-baseline gap-1">
                      {plan.price_usd === 0 ? (
                        <span className="text-5xl font-bold text-gray-900">Free</span>
                      ) : (
                        <>
                          <span className="text-2xl font-semibold text-gray-500">$</span>
                          <span className="text-5xl font-bold text-gray-900">{plan.price_usd}</span>
                          <span className="text-gray-500 font-medium">/month</span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-500">Billed monthly · USD</p>
                    <p className="mt-4 text-sm font-medium text-gray-700">
                      Ideal for: <span className="text-gray-600 font-normal">{plan.ui.idealFor}</span>
                    </p>

                    <ul className="mt-6 space-y-2.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              plan.slug === 'pro'
                                ? 'bg-purple-100'
                                : plan.slug === 'plus'
                                  ? 'bg-pink-100'
                                  : 'bg-gray-100'
                            }`}
                          >
                            <FaCheck
                              className={`h-2.5 w-2.5 ${
                                plan.slug === 'pro'
                                  ? 'text-purple-600'
                                  : plan.slug === 'plus'
                                    ? 'text-pink-600'
                                    : 'text-gray-600'
                              }`}
                            />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-8 pb-4 flex-1 space-y-6">
                    {plan.ui.sections.map(section => (
                      <div key={section.title}>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                          {section.title}
                        </h3>
                        <ul className="space-y-2">
                          {section.items.map(item => (
                            <li key={item} className="text-sm text-gray-600 flex gap-2">
                              <span className="text-pink-400">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="p-8 pt-0 mt-auto">
                    <PlanCta slug={plan.slug} currentSlug={currentSlug} isLoggedIn={Boolean(user)} />
                  </div>
                </article>
              )
            })}
          </div>
          <p className="mt-8 text-center text-xs text-gray-500 max-w-2xl mx-auto">
            * Pro &quot;unlimited&quot; items include fair-use limits (10 babies, 500 cry analyses/month) to
            protect platform quality. Normal families never reach these caps.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-4 py-20 bg-white/60 border-y border-pink-100 sm:px-6 lg:px-8 animate-fade-in-delay-150">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Compare every feature</h2>
            <p className="mt-3 text-gray-600 max-w-xl mx-auto">
              See exactly what you get on Free, Plus, and Pro — matched to limits enforced in the app.
            </p>
          </div>

          <div className="hidden lg:block overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-xl transition-shadow duration-300 hover:shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-pink-50 to-rose-50">
                  <th className="py-5 px-6 text-sm font-semibold text-gray-500 w-[40%]">Feature</th>
                  <th className="py-5 px-4 text-center text-sm font-bold text-gray-900">Free</th>
                  <th className="py-5 px-4 text-center text-sm font-bold text-pink-700 bg-pink-50/80">Plus</th>
                  <th className="py-5 px-4 text-center text-sm font-bold text-purple-700">Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={`${row.category}-${row.label}`}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  >
                    <td className="py-4 px-6">
                      <span className="text-xs text-gray-400 uppercase tracking-wide block">
                        {row.category}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{row.label}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <ComparisonCell value={row.free} />
                    </td>
                    <td className="py-4 px-4 text-center bg-pink-50/30">
                      <ComparisonCell value={row.plus} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <ComparisonCell value={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile comparison — stacked cards */}
          <div className="lg:hidden space-y-4">
            {(['free', 'plus', 'pro'] as PlanSlug[]).map(slug => (
              <div key={slug} className="rounded-2xl border border-pink-100 bg-white p-5 shadow-md">
                <h3 className="text-lg font-bold capitalize text-gray-900 mb-4 border-b border-pink-50 pb-2">
                  {slug}
                </h3>
                <dl className="space-y-3">
                  {COMPARISON_ROWS.map(row => (
                    <div key={row.label} className="flex justify-between gap-4 text-sm">
                      <dt className="text-gray-600">{row.label}</dt>
                      <dd className="font-medium text-gray-900 text-right">
                        {formatComparisonCell(row[slug]).type === 'bool' ? (
                          row[slug] ? (
                            <FaCheck className="text-emerald-500 inline" />
                          ) : (
                            <FaMinus className="text-gray-300 inline" />
                          )
                        ) : (
                          String(row[slug])
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 animate-fade-in-delay-300">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-10">Pricing FAQ</h2>
          <div className="space-y-4">
            {PRICING_FAQ.map((item, index) => (
              <div
                key={item.q}
                className="rounded-2xl border border-pink-100 bg-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-pink-50/30 transition-colors group"
                >
                  <span className="font-semibold text-gray-900 pr-4 group-hover:text-pink-600 transition-colors">
                    {item.q}
                  </span>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  >
                    <FaChevronDown className="h-3.5 w-3.5 text-white" />
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 pt-0 text-sm text-gray-600 leading-relaxed border-t border-pink-50">
                    <p className="pt-4">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8 animate-fade-in-delay-450">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 p-10 sm:p-14 text-center text-white shadow-2xl transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(236,72,153,0.45)] hover:-translate-y-0.5">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to understand every cry?</h2>
          <p className="mt-4 text-pink-50 text-lg max-w-xl mx-auto">
            Join MamtaAI free today. Upgrade when you need more babies, family access, and deeper insights.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={user ? '/dashboard' : '/welcome'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-pink-600 hover:bg-pink-50 shadow-lg"
            >
              {user ? 'Open dashboard' : 'Start free'}
              <FaArrowRight />
            </Link>
            <Link
              href="/#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/80 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10"
            >
              Explore features
            </Link>
          </div>
          <p className="mt-6 text-xs text-pink-100/90">
            MamtaAI is not a substitute for professional medical advice. In emergencies, contact your
            doctor or local emergency services.
          </p>
        </div>
      </section>

      <footer className="border-t border-pink-100 bg-white/80 py-8 px-4 text-center text-sm text-gray-500">
        <Link href="/" className="text-pink-600 font-medium hover:underline">
          ← Back to home
        </Link>
        <p className="mt-2">© {new Date().getFullYear()} MamtaAI. All rights reserved.</p>
      </footer>
    </div>
  )
}
