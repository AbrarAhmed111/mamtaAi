'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FaCheck, FaRegCopy, FaRegThumbsDown, FaRegThumbsUp } from 'react-icons/fa'
import logo from '@/assets/img/smallLogo.png'
import type { ChatMessage as ChatMessageType } from './types'

interface Props {
  message: ChatMessageType
  userAvatarUrl?: string
  userName?: string
  onRate?: (id: string, value: 'up' | 'down' | null) => void
}

/**
 * Lightweight Markdown-ish renderer: handles paragraphs, **bold**, *italic*,
 * inline `code`, and unordered/ordered list lines starting with - or 1.
 * Keeps zero dependencies so we don't pull a markdown lib for a small surface.
 */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null
  const blocks = text.split(/\n{2,}/)
  return blocks.map((block, bi) => {
    const lines = block.split('\n')
    const isUl = lines.every((l) => /^\s*[-*]\s+/.test(l))
    const isOl = lines.every((l) => /^\s*\d+\.\s+/.test(l))

    if (isUl) {
      return (
        <ul key={bi} className="my-1.5 list-disc space-y-1 pl-5">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\s*[-*]\s+/, ''))}</li>
          ))}
        </ul>
      )
    }
    if (isOl) {
      return (
        <ol key={bi} className="my-1.5 list-decimal space-y-1 pl-5">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\s*\d+\.\s+/, ''))}</li>
          ))}
        </ol>
      )
    }
    return (
      <p key={bi} className="whitespace-pre-wrap leading-relaxed">
        {renderInline(block)}
      </p>
    )
  })
}

function renderInline(text: string): React.ReactNode {
  // Order matters: code → bold → italic, since markers can nest oddly otherwise.
  const tokens: React.ReactNode[] = []
  let rest = text
  let key = 0
  // Simple state machine via regex replace pass.
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(rest)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(rest.slice(lastIndex, match.index))
    }
    const t = match[0]
    if (t.startsWith('`')) {
      tokens.push(
        <code
          key={key++}
          className="rounded bg-pink-50 px-1 py-0.5 font-mono text-[0.85em] text-pink-700"
        >
          {t.slice(1, -1)}
        </code>,
      )
    } else if (t.startsWith('**')) {
      tokens.push(
        <strong key={key++} className="font-semibold text-gray-900">
          {t.slice(2, -2)}
        </strong>,
      )
    } else {
      tokens.push(
        <em key={key++} className="italic">
          {t.slice(1, -1)}
        </em>,
      )
    }
    lastIndex = match.index + t.length
  }
  if (lastIndex < rest.length) tokens.push(rest.slice(lastIndex))
  return tokens
}

export default function ChatMessage({ message, userAvatarUrl, userName, onRate }: Props) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={`group flex w-full gap-2.5 animate-chat-message-in ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm">
          <Image src={logo} alt="MamtaBot" width={20} height={20} className="rounded-full" />
        </div>
      )}

      <div className={`flex max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
            isUser
              ? 'rounded-br-md bg-gradient-to-br from-pink-500 to-rose-500 text-white'
              : 'rounded-bl-md border border-pink-100 bg-white text-gray-800'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="space-y-2 text-gray-800 [&_p]:m-0">{renderMarkdown(message.content)}</div>
          )}

          {/* Streaming caret */}
          {message.isStreaming && (
            <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-pink-500 align-middle" />
          )}
        </div>

        {/* Actions row (assistant only) */}
        {!isUser && !message.isStreaming && message.content.length > 0 && (
          <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-pink-50 hover:text-pink-600"
              title="Copy"
              aria-label="Copy message"
            >
              {copied ? <FaCheck className="text-xs" /> : <FaRegCopy className="text-xs" />}
            </button>
            <button
              type="button"
              onClick={() => onRate?.(message.id, 'up')}
              className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-pink-50 ${
                message.feedback === 'up' ? 'text-pink-600' : 'text-gray-400 hover:text-pink-600'
              }`}
              title="Helpful"
              aria-label="Mark message helpful"
            >
              <FaRegThumbsUp className="text-xs" />
            </button>
            <button
              type="button"
              onClick={() => onRate?.(message.id, 'down')}
              className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-pink-50 ${
                message.feedback === 'down' ? 'text-pink-600' : 'text-gray-400 hover:text-pink-600'
              }`}
              title="Not helpful"
              aria-label="Mark message not helpful"
            >
              <FaRegThumbsDown className="text-xs" />
            </button>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-pink-200 bg-pink-50 shadow-sm">
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatarUrl} alt={userName ?? 'You'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-400 to-rose-400 text-xs font-semibold text-white">
              {(userName ?? 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
