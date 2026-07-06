'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import {
  FaUserMd,
  FaSearch,
  FaCheckCircle,
  FaBook,
  FaStar,
  FaCertificate,
  FaComments,
  FaClock,
  FaStethoscope,
} from 'react-icons/fa'
import Spinner from '@/components/ui/spinner'
import { isVerifiedExpert } from '@/lib/expert/active-view'

type Expert = {
  id: string
  fullName: string
  avatarUrl: string | null
  professionalTitle: string
  yearsOfExperience: string | null
  memberSince: string | null
  articleCount: number
  isNewExpert?: boolean
}

type ExpertPost = {
  id: string
  title: string
  excerpt: string | null
  category: string
  published_at: string | null
  author: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

type ExpertsResponse = {
  experts: Expert[]
  stats: {
    verifiedExperts: number
    expertArticles: number
    specialties: number
  }
  expertPosts: ExpertPost[]
}

type UserProfile = {
  role?: string
  is_expert?: boolean
  is_verified?: boolean
}

const SPECIALTY_FILTERS = [
  { id: 'all', label: 'All Experts', keywords: [] as string[] },
  { id: 'pediatrics', label: 'Pediatrics', keywords: ['pediatric', 'pediatrician', 'neonat', 'child doctor'] },
  { id: 'lactation', label: 'Lactation', keywords: ['lactation', 'breastfeed', 'ibclc', 'nursing'] },
  { id: 'sleep', label: 'Sleep', keywords: ['sleep', 'rest', 'bedtime'] },
  { id: 'nutrition', label: 'Nutrition', keywords: ['nutrition', 'diet', 'dietitian', 'feeding'] },
  { id: 'psychology', label: 'Psychology', keywords: ['psycholog', 'mental', 'therap', 'counsel'] },
] as const

function matchesSpecialty(title: string, filterId: string) {
  if (filterId === 'all') return true
  const filter = SPECIALTY_FILTERS.find(f => f.id === filterId)
  if (!filter) return true
  const haystack = title.toLowerCase()
  return filter.keywords.some(kw => haystack.includes(kw))
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
}

function formatDate(dateString: string | null) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ExpertAvatar({ name, avatarUrl, size = 'lg' }: { name: string; avatarUrl: string | null; size?: 'lg' | 'sm' }) {
  const dim = size === 'lg' ? 'h-20 w-20' : 'h-10 w-10'
  const text = size === 'lg' ? 'text-xl' : 'text-sm'

  if (avatarUrl) {
    return (
      <div className={`relative ${dim} shrink-0 overflow-hidden rounded-full ring-4 ring-pink-100`}>
        <Image src={avatarUrl} alt={name} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`${dim} shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 ${text} font-bold text-white ring-4 ring-pink-100`}
    >
      {getInitials(name) || '?'}
    </div>
  )
}

export default function ExpertsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<ExpertsResponse | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none')
  const [canApplyAsExpert, setCanApplyAsExpert] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all')
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [expertsRes, meRes, applyRes] = await Promise.all([
          fetch('/api/experts', { cache: 'no-store' }),
          fetch('/api/me', { cache: 'no-store' }),
          fetch('/api/experts/apply', { cache: 'no-store' }),
        ])
        const expertsJson = await expertsRes.json().catch(() => ({}))
        if (!expertsRes.ok) {
          setError(expertsJson?.error || 'Failed to load experts')
          return
        }
        setData(expertsJson as ExpertsResponse)

        if (meRes.ok) {
          const meJson = await meRes.json().catch(() => ({}))
          setUserProfile(meJson?.profile || null)
        }
        if (applyRes.ok) {
          const applyJson = await applyRes.json().catch(() => ({}))
          setApplicationStatus(applyJson.status || 'none')
          setCanApplyAsExpert(Boolean(applyJson.canApply))
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filteredExperts = useMemo(() => {
    const experts = data?.experts || []
    const q = searchQuery.trim().toLowerCase()
    return experts.filter(expert => {
      const matchesSearch =
        !q ||
        expert.fullName.toLowerCase().includes(q) ||
        expert.professionalTitle.toLowerCase().includes(q)
      const matchesFilter = matchesSpecialty(expert.professionalTitle, specialtyFilter)
      return matchesSearch && matchesFilter
    })
  }, [data?.experts, searchQuery, specialtyFilter])

  const selectedExpert = filteredExperts.find(e => e.id === selectedExpertId) || null

  const userIsVerifiedExpert = isVerifiedExpert(userProfile)
  const isApplicationPending = applicationStatus === 'pending'
  const showBecomeExpertCta =
    !userIsVerifiedExpert && applicationStatus !== 'pending' && canApplyAsExpert

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-gray-600">
        <Spinner size={18} />
        Loading experts...
      </div>
    )
  }

  if (error) {
    return <div className="text-red-600">{error}</div>
  }

  const stats = data?.stats || { verifiedExperts: 0, expertArticles: 0, specialties: 0 }

  return (
    <div className="w-full space-y-8">
      {/* Hero */}
      <section className="rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-pink-700 shadow-sm">
              <FaCertificate className="text-pink-500" />
              Verified professionals
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent sm:text-4xl">
              Expert Care Network
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              Connect with verified pediatricians, lactation consultants, and child development specialists.
              Get trusted guidance backed by professional credentials and MumtaAI&apos;s cry insights.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/dashboard/community?tab=blog"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-5 py-3 text-sm font-semibold text-pink-700 shadow-sm transition hover:bg-pink-50"
            >
              <FaBook />
              Expert Articles
            </Link>
            {showBecomeExpertCta && (
              <Link
                href="/dashboard/expert-application"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-pink-700 hover:to-rose-700"
              >
                <FaUserMd />
                Become an Expert
              </Link>
            )}
          </div>
        </div>
      </section>

      {isApplicationPending && (
        <div className="rounded-2xl border border-pink-100/80 bg-gradient-to-r from-pink-50 via-rose-50 to-white p-5 shadow-sm shadow-pink-100/20">
          <div className="flex items-start gap-3">
            <FaClock className="mt-0.5 shrink-0 text-pink-600" />
            <div>
              <p className="font-semibold text-gray-900">Your expert documents are under review</p>
              <p className="mt-1 text-sm text-gray-600">
                Our team is verifying your credentials. You can keep using your parent dashboard while you wait.
              </p>
            </div>
          </div>
        </div>
      )}

      {!userIsVerifiedExpert && applicationStatus === 'none' && (
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-white p-5">
          <p className="font-semibold text-gray-900">Are you a healthcare professional?</p>
          <p className="mt-1 text-sm text-gray-600">
            Apply to join as an expert and share trusted guidance with MumtaAI parents.
          </p>
          {showBecomeExpertCta ? (
            <Link
              href="/dashboard/expert-application"
              className="mt-3 inline-flex text-sm font-semibold text-pink-600 hover:text-pink-700"
            >
              Apply to join as an expert →
            </Link>
          ) : null}
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Verified Experts', value: stats.verifiedExperts, icon: FaUserMd, color: 'text-pink-600 bg-pink-50' },
          { label: 'Specialties', value: stats.specialties, icon: FaStethoscope, color: 'text-purple-600 bg-purple-50' },
          { label: 'Expert Articles', value: stats.expertArticles, icon: FaBook, color: 'text-rose-600 bg-rose-50' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="text-lg" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Search & filters */}
      <section>
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-pink-200 py-3 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SPECIALTY_FILTERS.map(filter => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSpecialtyFilter(filter.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                specialtyFilter === filter.id
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'border border-pink-200 bg-white text-gray-600 hover:border-pink-300 hover:text-pink-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* Expert directory */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Our Experts</h2>
          <p className="text-sm text-gray-500">{filteredExperts.length} available</p>
        </div>

        {filteredExperts.length === 0 ? (
          <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-10 text-center">
            <FaUserMd className="mx-auto mb-4 text-5xl text-pink-300" />
            <h3 className="text-xl font-bold text-gray-900">No experts match your search</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Try a different specialty or search term. New verified experts are added regularly as our network grows.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSpecialtyFilter('all')
              }}
              className="mt-5 rounded-xl bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredExperts.map(expert => (
              <article
                key={expert.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-100/50"
              >
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 pb-4 pt-6">
                  <div className="flex items-start gap-4">
                    <ExpertAvatar name={expert.fullName} avatarUrl={expert.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold text-gray-900 group-hover:text-pink-600">
                          {expert.fullName}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <FaCheckCircle className="text-[10px]" />
                          Verified
                        </span>
                        {expert.isNewExpert ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            <FaStar className="text-[10px]" />
                            Newbie
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-medium text-pink-700">{expert.professionalTitle}</p>
                      {expert.yearsOfExperience && (
                        <p className="mt-1 text-xs text-gray-500">{expert.yearsOfExperience} years experience</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-6 py-5">
                  <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <FaBook className="text-pink-400" />
                      {expert.articleCount} article{expert.articleCount === 1 ? '' : 's'}
                    </span>
                    {expert.memberSince && (
                      <span className="inline-flex items-center gap-1.5">
                        <FaStar className="text-amber-400" />
                        Since {formatDate(expert.memberSince)}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedExpertId(expert.id)}
                      className="w-full rounded-xl border border-pink-200 px-4 py-2.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-50"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Expert insights */}
      {(data?.expertPosts?.length || 0) > 0 && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Expert Insights</h2>
              <p className="text-sm text-gray-600">Latest articles from verified professionals</p>
            </div>
            <Link
              href="/dashboard/community?tab=blog"
              className="text-sm font-semibold text-pink-600 hover:text-pink-700"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.expertPosts.map(post => (
              <Link
                key={post.id}
                href={`/dashboard/community/blog/${post.id}`}
                className="group rounded-2xl border border-pink-100 bg-white p-5 shadow-sm transition hover:border-pink-200 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                    Expert
                  </span>
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-semibold text-pink-700">
                    {post.category}
                  </span>
                </div>
                <h3 className="line-clamp-2 font-bold text-gray-900 group-hover:text-pink-600">{post.title}</h3>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{post.excerpt}</p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <span>{post.author?.full_name || 'Expert'}</span>
                  <span>{formatDate(post.published_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-600 to-rose-600 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold">Are you a child health professional?</h2>
            <p className="mt-2 text-sm text-pink-100 sm:text-base">
              Join MumtaAI&apos;s expert network to share evidence-based guidance, publish articles for parents,
              and help families understand their baby&apos;s needs with confidence.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/expert-application"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-pink-700 shadow-lg transition hover:bg-pink-50"
            >
              <FaCertificate />
              Apply as Expert
            </Link>
            <Link
              href="/dashboard/community/forums/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FaComments />
              Join Discussions
            </Link>
          </div>
        </div>
      </section>

      {/* Expert detail modal — portaled to <body> so the fixed overlay covers the
          full viewport instead of being clipped by the boxed dashboard layout */}
      {selectedExpert && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedExpertId(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-pink-100 bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="expert-modal-title"
          >
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-6">
              <div className="flex items-center gap-4">
                <ExpertAvatar name={selectedExpert.fullName} avatarUrl={selectedExpert.avatarUrl} />
                <div>
                  <h3 id="expert-modal-title" className="text-xl font-bold text-gray-900">
                    {selectedExpert.fullName}
                  </h3>
                  <p className="text-sm font-medium text-pink-700">{selectedExpert.professionalTitle}</p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <FaCheckCircle />
                    MumtaAI Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedExpert.yearsOfExperience && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="font-semibold text-gray-900">{selectedExpert.yearsOfExperience} years</p>
                  </div>
                )}
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Articles</p>
                  <p className="font-semibold text-gray-900">{selectedExpert.articleCount}</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-gray-600">
                {selectedExpert.fullName} is a verified MumtaAI expert providing trusted guidance on infant care,
                development, and wellbeing. Browse their published articles in the community blog.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                {selectedExpert.articleCount > 0 ? (
                  <Link
                    href="/dashboard/community?tab=blog"
                    onClick={() => setSelectedExpertId(null)}
                    className="flex-1 rounded-xl bg-pink-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-pink-700"
                  >
                    Read Articles
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 cursor-not-allowed rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400"
                  >
                    No articles yet
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedExpertId(null)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
