'use client'

import { useRef } from 'react'
import { FaArrowDown, FaRedo } from 'react-icons/fa'
import ChatInput from './ChatInput'
import ChatHeader from './ChatHeader'
import ChatEmptyState from './ChatEmptyState'
import ChatMessageList from './ChatMessageList'
import ScrollToBottomButton from './ScrollToBottomButton'
import { useMockChat } from './useMockChat'
import {
  useCloseAnimation,
  useKeyboardShortcuts,
  useClearConfirm,
  useAutoScroll,
} from './hooks'
import { CLOSE_ANIMATION_DURATION } from './constants'

interface Props {
  open: boolean
  onClose: () => void
  userName?: string
  userAvatarUrl?: string
}

export default function ChatPanel({ open, onClose, userName, userAvatarUrl }: Props) {
  const { messages, isStreaming, sendMessage, stop, regenerate, clear, rateMessage } = useMockChat()

  const scrollRef = useRef<HTMLDivElement>(null)
  const { isClosing, handleClose } = useCloseAnimation(onClose)
  const { autoFollow, handleScroll, scrollToBottom } = useAutoScroll(messages, scrollRef)
  const { confirmingClear, setConfirmingClear, toggleConfirm } = useClearConfirm(!open)

  useKeyboardShortcuts(open, handleClose)

  if (!open && !isClosing) return null

  // Derived state
  const hasUserSentAnything = messages.some((m) => m.role === 'user')
  const lastMessage = messages.at(-1)
  const isLastAssistantStreaming = lastMessage?.role === 'assistant' && lastMessage?.isStreaming
  const isLastMessageEmpty = isLastAssistantStreaming && lastMessage?.content === ''
  const showRegenerateButton = !isStreaming && hasUserSentAnything && !isLastMessageEmpty

  const handleClearClick = () => {
    if (confirmingClear) {
      clear()
      setConfirmingClear(false)
    } else {
      toggleConfirm()
    }
  }

  return (
    <>
      {/* Backdrop - clickable to close on all screen sizes */}
      <div
        className="fixed inset-0 z-[58] bg-black/30  sm:bg-transparent animate-chat-message-in"
        onClick={handleClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="MamtaBot assistant"
        className={`fixed z-[60] flex flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-pink-100
                   inset-0 rounded-none
                   sm:inset-auto sm:bottom-28 sm:right-12 sm:h-[min(640px,calc(100vh-8rem))] sm:w-[26rem] sm:rounded-2xl
                   ${isClosing ? 'animate-chat-panel-out' : 'animate-chat-panel-in'}`}
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Header */}
        <ChatHeader
          isStreaming={isStreaming}
          hasMessages={hasUserSentAnything}
          confirmingClear={confirmingClear}
          onClear={handleClearClick}
          onClose={handleClose}
        />

        {/* Messages Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto bg-gradient-to-br from-pink-50/40 via-white to-rose-50/30 px-3 py-4 sm:px-4"
        >
          {/* Empty State */}
          {!hasUserSentAnything && (
            <ChatEmptyState onSendMessage={sendMessage} />
          )}

          {/* Message List */}
          <ChatMessageList
            messages={messages}
            userName={userName}
            userAvatarUrl={userAvatarUrl}
            onRate={rateMessage}
          />

          {/* Scroll to Bottom Button */}
          {!autoFollow && (
            <ScrollToBottomButton onClick={scrollToBottom} />
          )}
        </div>

        {/* Regenerate Button */}
        {showRegenerateButton && (
          <div className="flex shrink-0 items-center justify-center border-t border-pink-100 bg-white/95 px-3 py-1.5">
            <button
              type="button"
              onClick={regenerate}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-medium text-pink-600 transition-colors hover:bg-pink-50"
              aria-label="Regenerate last response"
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
