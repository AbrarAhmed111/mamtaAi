'use client'

import { useEffect, useRef, useState } from 'react'
import { FaExchangeAlt } from 'react-icons/fa'
import { toast } from '@/components/ui/sonner'
import type { ActiveViewPreference } from '@/lib/expert/constants'

export default function ExpertViewSwitcher({
  activeView,
  onSwitched,
}: {
  activeView: ActiveViewPreference
  onSwitched?: (view: ActiveViewPreference) => void
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

  const switchTo = async (view: ActiveViewPreference) => {
    if (view === activeView || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/profile/active-view', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_view: view }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to switch view')
      toast.success(view === 'expert' ? 'Switched to Expert view' : 'Switched to Parent view')
      onSwitched?.(view)
      setOpen(false)
      window.location.reload()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to switch view')
    } finally {
      setBusy(false)
    }
  }

  const otherView: ActiveViewPreference = activeView === 'expert' ? 'parent' : 'expert'
  const label = activeView === 'expert' ? 'Expert' : 'Parent'

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={busy}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(v => !v)}
        className="hidden items-center gap-2 rounded-full border border-pink-200 bg-white px-3 py-1.5 text-xs font-semibold text-pink-700 shadow-sm hover:bg-pink-50 disabled:opacity-60 sm:inline-flex"
      >
        <FaExchangeAlt className="text-[11px]" />
        Viewing as: {label}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[100] mt-2 w-52 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-lg shadow-pink-100/40"
        >
          <p className="border-b border-pink-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Dashboard view
          </p>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => void switchTo(otherView)}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-pink-50 disabled:opacity-60"
          >
            Switch to {otherView === 'expert' ? 'Expert' : 'Parent'} view
          </button>
        </div>
      ) : null}
    </div>
  )
}
