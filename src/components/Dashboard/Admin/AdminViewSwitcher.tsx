'use client'

import { useEffect, useRef, useState } from 'react'
import { FaExchangeAlt, FaUserShield } from 'react-icons/fa'
import { toast } from '@/components/ui/sonner'
import type { AdminDashboardView } from '@/lib/expert/constants'

export default function AdminViewSwitcher({
  activeView,
}: {
  activeView: AdminDashboardView
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (!root || root.contains(event.target as Node)) return
      setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const switchTo = async (view: AdminDashboardView) => {
    if (view === activeView || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/profile/active-view', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboard_view: view }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to switch view')
      toast.success(
        view === 'admin' ? 'Switched to Admin view' : 'Switched to User (parent) view',
      )
      setOpen(false)
      window.location.assign('/dashboard')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to switch view')
    } finally {
      setBusy(false)
    }
  }

  const otherView: AdminDashboardView = activeView === 'admin' ? 'parent' : 'admin'
  const label = activeView === 'admin' ? 'Admin' : 'User'

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={busy}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-purple-800 shadow-sm hover:bg-purple-50 disabled:opacity-60 sm:px-3 sm:text-xs"
      >
        <FaExchangeAlt className="hidden text-[10px] sm:inline" />
        <FaUserShield className="text-[10px] sm:hidden" />
        <span className="hidden sm:inline">Viewing as: {label}</span>
        <span className="sm:hidden">{label}</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[100] mt-2 w-56 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-lg shadow-purple-100/40"
        >
          <p className="border-b border-purple-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Dashboard view
          </p>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => void switchTo(otherView)}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 disabled:opacity-60"
          >
            Switch to {otherView === 'admin' ? 'Admin panel' : 'User (parent) view'}
          </button>
          <p className="border-t border-purple-50 px-4 py-2 text-[11px] leading-snug text-gray-500">
            User view previews the parent dashboard. Admin API access is unchanged.
          </p>
        </div>
      ) : null}
    </div>
  )
}
