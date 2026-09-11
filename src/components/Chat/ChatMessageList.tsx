'use client'

import ChatMessage from './ChatMessage'
import TypingBubble from './TypingBubble'
import { TYPING_INDICATOR_EMPTY_CONTENT } from './constants'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  isStreaming?: boolean
}

interface ChatMessageListProps {
  messages: Message[]
  userName?: string | null
  userAvatarUrl?: string | null
  onRate?: (id: string, value: 'up' | 'down' | null) => void
}

export default function ChatMessageList({
  messages,
  userName,
  userAvatarUrl,
  onRate,
}: ChatMessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((m) =>
        m.role === 'assistant' && m.isStreaming && m.content === TYPING_INDICATOR_EMPTY_CONTENT ? (
          <TypingBubble key={m.id} messageId={m.id} />
        ) : (
          <ChatMessage
            key={m.id}
            message={m}
            userAvatarUrl={userAvatarUrl}
            userName={userName}
            onRate={onRate}
          />
        ),
      )}
    </div>
  )
}
