'use client'

import { useCallback, useRef, useState } from 'react'
import { chatWithRag, type ChatMessage as RagChatMessage } from '@/lib/ragChatApi'
import type { ChatMessage } from './types'

/**
 * AI chat hook that integrates with mamtaai-rag backend.
 * Uses RAG (Retrieval-Augmented Generation) service for intelligent responses.
 * Simulates streaming by progressively showing the full response.
 */

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm **MamtaBot** — your AI parenting companion. Ask me about feeding, sleep, cries, milestones, or how to use MamtaAI. I'll keep it short and parent-friendly.",
  createdAt: Date.now(),
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Simulates streaming text by emitting chunks with variable delays.
 * This creates a typing effect while displaying the full response.
 */
function streamText(
  full: string,
  onChunk: (delta: string) => void,
  signal: { cancelled: boolean },
): Promise<void> {
  return new Promise<void>((resolve) => {
    let i = 0
    const tick = () => {
      if (signal.cancelled || i >= full.length) {
        resolve()
        return
      }
      // Emit 1–4 chars per tick so it feels like tokens, not typing.
      const stepSize = Math.min(full.length - i, 1 + Math.floor(Math.random() * 4))
      const delta = full.slice(i, i + stepSize)
      onChunk(delta)
      i += stepSize

      const lastChar = delta[delta.length - 1]
      // Slight pause at punctuation for a natural cadence.
      const delay = /[\.\?\!]\s?$/.test(delta)
        ? 80 + Math.random() * 120
        : /,|;|:|\n/.test(lastChar)
          ? 40 + Math.random() * 80
          : 12 + Math.random() * 26

      setTimeout(tick, delay)
    }
    tick()
  })
}

export interface UseAiChatResult {
  messages: ChatMessage[]
  isStreaming: boolean
  sendMessage: (text: string) => void
  stop: () => void
  regenerate: () => void
  clear: () => void
  rateMessage: (id: string, value: 'up' | 'down' | null) => void
}

export function useAiChat(): UseAiChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [isStreaming, setIsStreaming] = useState(false)
  const cancelRef = useRef<{ cancelled: boolean } | null>(null)
  const lastUserRef = useRef<string>('')
  const lastAssistantIdRef = useRef<string>('')

  const finalize = useCallback((id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m)))
    setIsStreaming(false)
  }, [])

  const runAssistant = useCallback(
    async (assistantId: string, messageHistory: ChatMessage[]) => {
      // Small initial "thinking" delay before tokens start arriving.
      await new Promise((r) => setTimeout(r, 450 + Math.random() * 450))

      if (cancelRef.current?.cancelled) {
        finalize(assistantId)
        return
      }

      try {
        // Build message history for the API
        // Only include messages with non-empty content (filter out assistant messages before they're populated)
        const historyForApi: RagChatMessage[] = messageHistory
          .filter(
            (m) =>
              m.id !== 'welcome' && // Don't send welcome to API
              (m.role === 'user' || (m.role === 'assistant' && m.content.trim().length > 0)), // Only send assistant if it has content
          )
          .map((m) => ({
            role: m.role,
            content: m.content,
          }))

        // Call the RAG API with conversation history
        const response = await chatWithRag(historyForApi)
        const reply = response.reply

        if (cancelRef.current?.cancelled) {
          finalize(assistantId)
          return
        }

        const cancelSignal = cancelRef.current!

        // Stream the response character by character for visual effect
        await streamText(
          reply,
          (delta) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
            )
          },
          cancelSignal,
        )

        finalize(assistantId)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to get response from chat service'
        console.error('Chat error:', error)

        // Show error message to user
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
                  isStreaming: false,
                }
              : m,
          ),
        )
        setIsStreaming(false)
      }
    },
    [finalize],
  )

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      lastUserRef.current = trimmed
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      }

      const assistantId = uid()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        isStreaming: true,
      }

      lastAssistantIdRef.current = assistantId

      const newMessages = [...messages, userMsg, assistantMsg]
      setMessages(newMessages)
      setIsStreaming(true)
      cancelRef.current = { cancelled: false }

      // Start the assistant response generation with the new message history
      runAssistant(assistantId, newMessages)
    },
    [isStreaming, messages, runAssistant],
  )

  const stop = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.cancelled = true
    }
    const assistantId = lastAssistantIdRef.current
    if (assistantId) {
      finalize(assistantId)
    }
  }, [finalize])

  const regenerate = useCallback(() => {
    if (!lastUserRef.current || isStreaming) return

    // Remove the last assistant message and regenerate
    const messagesWithoutLastAssistant = messages.filter(
      (m) => m.id !== lastAssistantIdRef.current,
    )

    const assistantId = uid()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      isStreaming: true,
    }

    lastAssistantIdRef.current = assistantId

    const newMessages = [...messagesWithoutLastAssistant, assistantMsg]
    setMessages(newMessages)
    setIsStreaming(true)
    cancelRef.current = { cancelled: false }

    // Regenerate with the new message history
    runAssistant(assistantId, newMessages)
  }, [messages, isStreaming, runAssistant])

  const clear = useCallback(() => {
    setMessages([WELCOME])
    setIsStreaming(false)
    cancelRef.current = { cancelled: true }
  }, [])

  const rateMessage = useCallback((id: string, value: 'up' | 'down' | null) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, feedback: value } : m)),
    )
  }, [])

  return {
    messages,
    isStreaming,
    sendMessage,
    stop,
    regenerate,
    clear,
    rateMessage,
  }
}
