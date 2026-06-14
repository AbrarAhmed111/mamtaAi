'use client'

import Link from 'next/link'

/** Primary CTA — matches parent dashboard pink gradient buttons */
export const ADMIN_BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-200/50 transition-all hover:from-pink-600 hover:to-rose-600 hover:shadow-lg disabled:opacity-50'

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <section className="mb-6 rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent sm:text-3xl">
            {title}
          </h1>
          {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        </div>
        {action}
      </div>
    </section>
  )
}

export function AdminSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
      {children}
    </h2>
  )
}

export function AdminStatCard({
  label,
  value,
  href,
  accent = 'pink',
}: {
  label: string
  value: string | number
  href?: string
  accent?: 'pink' | 'purple' | 'emerald' | 'amber' | 'rose'
}) {
  const colors = {
    pink: 'border-pink-100 bg-pink-50/60',
    purple: 'border-purple-100 bg-purple-50/60',
    emerald: 'border-emerald-100 bg-emerald-50/60',
    amber: 'border-amber-100 bg-amber-50/60',
    rose: 'border-rose-100 bg-rose-50/60',
  }
  const labelColors = {
    pink: 'text-pink-600',
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
  }
  const inner = (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${colors[accent]} ${href ? 'transition hover:shadow-md hover:border-pink-200' : ''}`}
    >
      <p className={`text-xs font-medium uppercase tracking-wide ${labelColors[accent]}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
        {value}
      </p>
    </div>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

export function AdminTableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-pink-100/80 bg-white shadow-sm shadow-pink-100/20">
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export function AdminEmptyState({ message }: { message: string }) {
  return <p className="p-8 text-center text-sm text-gray-500">{message}</p>
}

export function AdminBadge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode
  tone?: 'gray' | 'green' | 'amber' | 'rose' | 'purple' | 'pink'
}) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-700',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}
