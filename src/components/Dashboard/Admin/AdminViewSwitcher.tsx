'use client'

import { useEffect, useRef, useState } from 'react'
import { FaChevronDown, FaUserShield } from 'react-icons/fa'
import { toast } from '@/components/ui/sonner'
import ViewSwitcherDropdown from '@/components/Dashboard/ViewSwitcherDropdown'
import type { AdminDashboardView } from '@/lib/expert/constants'
import { switchAdminDashboardView } from '@/lib/expert/switch-dashboard-view'

export default function AdminViewSwitcher({
  activeView,
  placement = 'header',
}: {
  activeView: AdminDashboardView
  placement?: 'header' | 'panel'
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
      await switchAdminDashboardView(view)
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
  const isPanel = placement === 'panel'

  return (
    <div className={`relative shrink-0 ${isPanel ? 'w-full' : ''}`} ref={rootRef}>
      <button
        type="button"
        disabled={busy}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(v => !v)}
        className={
          isPanel
            ? 'inline-flex w-full items-center justify-between gap-2 rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-xs font-semibold text-purple-800 shadow-sm hover:bg-purple-50 disabled:opacity-60'
            : 'inline-flex max-w-[7.5rem] items-center gap-1 rounded-full border border-purple-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-purple-800 shadow-sm hover:bg-purple-50 disabled:opacity-60 sm:max-w-none sm:gap-1.5 sm:px-3 sm:text-xs'
        }
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <FaUserShield className="shrink-0 text-[10px]" aria-hidden />
          <span className="truncate">Viewing as: {label}</span>
        </span>
        <FaChevronDown
          className={`h-2.5 w-2.5 shrink-0 text-purple-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <ViewSwitcherDropdown
        open={open}
        onClose={() => setOpen(false)}
        title="Dashboard view"
        theme="purple"
        placement={placement}
        footer="User view previews the parent dashboard. Admin API access is unchanged."
      >
        <button
          type="button"
          role="menuitem"
          disabled={busy}
          onClick={() => void switchTo(otherView)}
          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-purple-50 disabled:opacity-60 sm:py-2.5"
        >
          Switch to {otherView === 'admin' ? 'Admin panel' : 'User (parent) view'}
        </button>
      </ViewSwitcherDropdown>
    </div>
  )
}
