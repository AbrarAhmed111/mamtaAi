'use client'

import { useEffect, useRef, useState } from 'react'
import { FaPaperPlane, FaStop } from 'react-icons/fa'

interface Props {
  onSend: (text: string) => void
  onStop?: () => void
  disabled?: boolean
  isStreaming?: boolean
  placeholder?: string
}

const MAX_HEIGHT = 160

export default function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  placeholder = 'Ask MamtaBot anything…',
}: Props) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-grow the textarea up to MAX_HEIGHT.
  useEffect(() => {
    const ta = ref.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, MAX_HEIGHT) + 'px'
  }, [value])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isStreaming) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = value.trim().length > 0 && !disabled && !isStreaming

  return (
    <div className="border-t border-pink-100 bg-white/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div
        className={`flex items-end gap-2 rounded-2xl border bg-white px-3 py-2 shadow-sm transition-all ${
          disabled
            ? 'border-pink-100 opacity-60'
            : 'border-pink-200 focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-300/40'
        }`}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent text-sm leading-6 text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
          aria-label="Chat message"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-pink-200 bg-white text-pink-600 transition-all hover:bg-pink-50 active:scale-95"
            title="Stop generating"
            aria-label="Stop generating"
          >
            <FaStop className="text-xs" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all active:scale-95 ${
              canSend
                ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-sm hover:from-pink-600 hover:to-rose-600 hover:shadow-md'
                : 'bg-gray-200 text-gray-400 shadow-none'
            }`}
            title="Send"
            aria-label="Send message"
          >
            <FaPaperPlane className="text-xs translate-x-px" />
          </button>
        )}
      </div>

      <p className="mt-2 text-center text-[11px] text-gray-400">
        MamtaBot can make mistakes. Verify important matters with your pediatrician.
      </p>
    </div>
  )
}
