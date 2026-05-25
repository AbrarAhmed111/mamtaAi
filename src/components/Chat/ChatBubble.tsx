'use client'

import { useEffect, useState } from 'react'
import { FaCommentDots, FaTimes } from 'react-icons/fa'
import ChatPanel from './ChatPanel'

interface Props {
  userName?: string
  userAvatarUrl?: string
}

/**
 * Floating, theme-matched launcher for the MamtaBot chat panel.
 *
 * - Lives at the bottom-right on every page that renders it.
 * - Persists open/closed state per browser session.
 * - Pulsing ring on first visit until the user opens it once.
 */
const STORAGE_KEY = 'mamtaai:chat:openedOnce'

export default function ChatBubble({ userName, userAvatarUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [pulse, setPulse] = useState(false)

  // Pulse once per session until the user opens the chat for the first time.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const opened = sessionStorage.getItem(STORAGE_KEY) === '1'
      setPulse(!opened)
    } catch {
      setPulse(true)
    }
  }, [])

  const handleToggle = () => {
    setOpen((v) => {
      const next = !v
      if (next) {
        try {
          sessionStorage.setItem(STORAGE_KEY, '1')
        } catch {
          // ignore storage failures
        }
        setPulse(false)
      }
      return next
    })
  }

  return (
    <>
      {/* Launcher button — hidden behind the panel on mobile to avoid stacking */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={open ? 'Close MamtaBot chat' : 'Open MamtaBot chat'}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-[55] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl ring-1 ring-pink-300/40 transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300 sm:bottom-6 sm:right-6
          ${open
            ? 'bg-white text-pink-600 ring-pink-200'
            : 'bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'}
          ${open ? '' : 'animate-chat-bubble-float'}
        `}
      >
        {/* Pulsing ring while the user hasn't tried the bot yet */}
        {pulse && !open && (
          <>
            <span className="pointer-events-none absolute inset-0 rounded-full bg-pink-400/60 animate-chat-pulse-ring" />
            <span
              className="pointer-events-none absolute inset-0 rounded-full bg-pink-400/40 animate-chat-pulse-ring"
              style={{ animationDelay: '700ms' }}
            />
          </>
        )}

        <span
          className={`relative transition-transform duration-300 ${
            open ? 'rotate-90' : 'rotate-0'
          }`}
        >
          {open ? <FaTimes className="text-lg" /> : <FaCommentDots className="text-xl" />}
        </span>

        {/* "AI" sparkle badge */}
        {!open && (
          <span className="pointer-events-none absolute -top-1.5 -right-1 select-none rounded-full border border-white bg-white px-1.5 py-0.5 text-[9px] font-bold leading-none text-pink-600 shadow">
            AI
          </span>
        )}
      </button>

      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        userName={userName}
        userAvatarUrl={userAvatarUrl}
      />
    </>
  )
}
