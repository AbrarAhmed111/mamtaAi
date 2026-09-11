'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { FaComment } from 'react-icons/fa'
import ChatPanel from '@/components/Chat/ChatPanel'

const AUTH_ROUTES = [
  '/signin',
  '/signup',
  '/forget-password',
  '/reset-password',
  '/verify-email',
  '/welcome',
  '/account-suspended',
]

interface ChatbotWidgetProps {
  userName?: string
  userAvatarUrl?: string
}

/**
 * Custom hook to handle hydration
 */
const useHydrated = () => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Custom hook to check if current route is an auth route
 */
const useIsAuthRoute = () => {
  const pathname = usePathname()

  return AUTH_ROUTES.some(
    (route) => pathname?.startsWith(route) || pathname?.includes('(auth)')
  )
}

export default function ChatbotWidget({ userName, userAvatarUrl }: ChatbotWidgetProps) {
  const isHydrated = useHydrated()
  const isAuthRoute = useIsAuthRoute()
  const [isOpen, setIsOpen] = useState(false)

  // Don't show chatbot on auth pages or before hydration
  if (!isHydrated || isAuthRoute) return null

  return (
    <>
      {/* Chat Panel */}
      <ChatPanel
        open={isOpen}
        onClose={() => setIsOpen(false)}
        userName={userName}
        userAvatarUrl={userAvatarUrl}
      />

      {/* Floating Chat Button (always visible) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 text-white shadow-lg ring-1 ring-pink-400/50 transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 sm:bottom-8 sm:right-8"
        aria-label="Open AI assistant chat"
        title="Chat with MamtaBot AI Assistant"
      >
        <FaComment className="h-6 w-6" />
      </button>
    </>
  )
}
