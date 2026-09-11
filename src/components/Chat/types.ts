export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  /** Final accumulated text. While streaming, this grows token by token. */
  content: string
  createdAt: number
  /** True while the assistant is still generating this message. */
  isStreaming?: boolean
  /** User feedback on assistant messages (persists locally for now). */
  feedback?: 'up' | 'down' | null
}

export interface ChatSuggestion {
  label: string
  prompt: string
}
