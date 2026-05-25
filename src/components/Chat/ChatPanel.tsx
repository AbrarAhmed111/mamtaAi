'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { FaArrowDown, FaRedo, FaTimes, FaTrashAlt } from 'react-icons/fa'
import logo from '@/assets/img/smallLogo.png'
import ChatInput from './ChatInput'
import ChatMessage from './ChatMessage'
import SuggestionChips from './SuggestionChips'
import TypingIndicator from './TypingIndicator'
import { useMockChat } from './useMockChat'

interface Props {
  open: boolean
  onClose: () => void
  userName?: string
  userAvatarUrl?: string
}

export default function ChatPanel({ open, onClose, userName, userAvatarUrl }: Props) {
  const { messages, isStreaming, sendMessage, stop, regenerate, clear, rateMessage } = useMockChat()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoFollow, setAutoFollow] = useState(true)
  const [confirmingClear, setConfirmingClear] = useState(false)

  /** True when the user is near the bottom; we only auto-scroll then. */
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
    setAutoFollow(distanceFromBottom < 80)
  }

  /** Auto-scroll on new content if the user hasn't scrolled up. */
  useEffect(() => {
    if (!autoFollow) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, autoFollow])

  /** Close on Escape; lock body scroll on mobile while open. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    if (window.innerWidth < 640) document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  /** Reset clear-confirm if the panel closes. */
  useEffect(() => {
    if (!open) setConfirmingClear(false)
  }, [open])

  if (!open) return null

  const hasUserSentAnything = messages.some((m) => m.role === 'user')
  const lastIsAssistantStreaming = messages.at(-1)?.role === 'assistant' && messages.at(-1)?.isStreaming
  const lastAssistantEmpty = lastIsAssistantStreaming && messages.at(-1)?.content === ''

  const scrollToBottom = () => {
    setAutoFollow(true)
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-[58] bg-black/30 backdrop-blur-sm sm:hidden animate-chat-message-in"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="MamtaBot assistant"
        className="fixed z-[60] flex flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-pink-100 animate-chat-panel-in
                   inset-0 rounded-none
                   sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(640px,calc(100vh-8rem))] sm:w-[26rem] sm:rounded-2xl"
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Header */}
        <div className="relative shrink-0 bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40 backdrop-blur">
                  <Image src={logo} alt="MamtaBot" width={26} height={26} className="rounded-full" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">MamtaBot</p>
                <p className="text-[11px] text-pink-50/90">
                  {isStreaming ? 'Thinking…' : 'AI parenting assistant'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasUserSentAnything && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirmingClear) {
                      clear()
                      setConfirmingClear(false)
                    } else {
                      setConfirmingClear(true)
                      setTimeout(() => setConfirmingClear(false), 2500)
                    }
                  }}
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs transition-all ${
                    confirmingClear
                      ? 'bg-white text-pink-600'
                      : 'text-white/90 hover:bg-white/15'
                  }`}
                  title={confirmingClear ? 'Click again to confirm' : 'Clear chat'}
                  aria-label="Clear chat"
                >
                  <FaTrashAlt className="text-[11px]" />
                  <span className="hidden sm:inline">{confirmingClear ? 'Confirm?' : 'Clear'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/15"
                aria-label="Close chat"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto bg-gradient-to-br from-pink-50/40 via-white to-rose-50/30 px-3 py-4 sm:px-4"
        >
          {/* Empty state — only when there are no user messages yet */}
          {!hasUserSentAnything && (
            <div className="mb-4 space-y-4 px-1">
              <div className="rounded-2xl border border-pink-100 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm">
                    <Image src={logo} alt="MamtaBot" width={22} height={22} className="rounded-full" />
                  </div>
                  <div className="text-sm leading-relaxed text-gray-700">
                    <p className="font-semibold text-gray-900">How can I help today?</p>
                    <p className="mt-0.5 text-gray-600">
                      Ask about feeding, sleep, cries, milestones, or how to use MamtaAI.
                    </p>
                  </div>
                </div>
              </div>
              <SuggestionChips onPick={(p) => sendMessage(p)} />
            </div>
          )}

          {/* Message list */}
          <div className="space-y-4">
            {messages.map((m) =>
              m.role === 'assistant' && m.isStreaming && m.content === '' ? (
                <div key={m.id} className="flex w-full justify-start gap-2.5 animate-chat-message-in">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm">
                    <Image src={logo} alt="MamtaBot" width={20} height={20} className="rounded-full" />
                  </div>
                  <TypingIndicator />
                </div>
              ) : (
                <ChatMessage
                  key={m.id}
                  message={m}
                  userAvatarUrl={userAvatarUrl}
                  userName={userName}
                  onRate={rateMessage}
                />
              ),
            )}
          </div>

          {/* Floating "scroll to bottom" pill when user has scrolled up */}
          {!autoFollow && (
            <div className="pointer-events-none sticky bottom-2 flex justify-end pr-1">
              <button
                type="button"
                onClick={scrollToBottom}
                className="pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-pink-200 bg-white/95 px-3 text-xs font-medium text-pink-600 shadow-lg backdrop-blur transition-all hover:bg-white"
                aria-label="Scroll to latest message"
              >
                <FaArrowDown className="text-[10px]" />
                New
              </button>
            </div>
          )}
        </div>

        {/* Regenerate row */}
        {!isStreaming && hasUserSentAnything && !lastAssistantEmpty && (
          <div className="flex shrink-0 items-center justify-center border-t border-pink-100 bg-white/95 px-3 py-1.5">
            <button
              type="button"
              onClick={regenerate}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-medium text-pink-600 transition-colors hover:bg-pink-50"
            >
              <FaRedo className="text-[10px]" />
              Regenerate
            </button>
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          onStop={stop}
          isStreaming={isStreaming}
        />
      </div>
    </>
  )
}
