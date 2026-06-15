'use client'

import type { ReactNode } from 'react'

type ViewSwitcherDropdownProps = {
  open: boolean
  onClose: () => void
  title: string
  theme: 'purple' | 'pink'
  children: ReactNode
  footer?: ReactNode
  /** `header` = dashboard top bar; `panel` = sidebar drawer (anchored under trigger). */
  placement?: 'header' | 'panel'
}

const themeClasses = {
  purple: {
    panel: 'border-purple-100 shadow-purple-100/40',
    header: 'border-purple-50',
    footer: 'border-purple-50',
  },
  pink: {
    panel: 'border-pink-100 shadow-pink-100/40',
    header: 'border-pink-50',
    footer: 'border-pink-50',
  },
} as const

/** Mobile: fixed panel + backdrop. Desktop: anchored under the trigger. */
export default function ViewSwitcherDropdown({
  open,
  onClose,
  title,
  theme,
  children,
  footer,
  placement = 'header',
}: ViewSwitcherDropdownProps) {
  if (!open) return null

  const t = themeClasses[theme]
  const isPanel = placement === 'panel'

  return (
    <>
      {!isPanel ? (
        <button
          type="button"
          aria-label="Close view menu"
          className="fixed inset-0 z-[64] bg-black/25 sm:hidden"
          onClick={onClose}
        />
      ) : null}
      <div
        role="menu"
        className={
          isPanel
            ? `absolute left-0 right-0 top-full z-[20] mt-2 w-full overflow-hidden rounded-2xl border bg-white shadow-lg ${t.panel}`
            : `fixed left-3 right-3 top-[5.25rem] z-[65] max-h-[min(16rem,calc(100dvh-6rem))] overflow-y-auto overscroll-contain rounded-2xl border bg-white shadow-lg sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-56 sm:max-h-none ${t.panel}`
        }
      >
        <p
          className={`border-b px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 ${t.header}`}
        >
          {title}
        </p>
        {children}
        {footer ? (
          <p className={`border-t px-4 py-2.5 text-[11px] leading-snug text-gray-500 ${t.footer}`}>
            {footer}
          </p>
        ) : null}
      </div>
    </>
  )
}
