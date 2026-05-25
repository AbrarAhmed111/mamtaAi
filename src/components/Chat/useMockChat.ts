'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from './types'

/**
 * Mock chat hook that mimics a streaming LLM response (GPT-style),
 * with realistic timing, "thinking" delay before the first token,
 * variable streaming speed, and stop/regenerate controls.
 *
 * Replace `pickMockReply` with a real `fetch('/api/chat', { method: 'POST' })`
 * + ReadableStream reader when the FastAPI backend is ready.
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

/** Tiny canned-reply matcher so the mock feels responsive to context. */
function pickMockReply(question: string): string {
  const q = question.toLowerCase()

  if (/(^|\b)(hi|hello|hey|hola|namaste)\b/.test(q)) {
    return "Hi! I'm here to help.\n\nTell me what's going on — feeding, sleep, a cry that's puzzling you, or just a quick question about MamtaAI. I'll keep the answer short and clear."
  }

  if (/cry|crying|cries|fuss/.test(q)) {
    return [
      'A useful order to check when a baby cries:',
      '',
      '1. **Hunger** — has it been a while since the last feed, or is your baby cluster feeding?',
      '2. **Tired** — short wake windows mean overtiredness shows up as harder crying.',
      '3. **Discomfort** — diaper, temperature, clothing tags, a hair around a toe.',
      '4. **Gas / burp** — try upright cuddles or gentle bicycle legs.',
      '',
      "If the cry sounds unusual, your baby has a fever, breathing changes, or seems unusually sleepy, contact your pediatrician.\n\n_Educational only — not medical advice._",
    ].join('\n')
  }

  if (/feed|milk|hungry|formula|breast|bottle/.test(q)) {
    return [
      'Quick feeding pointers:',
      '',
      '- Watch for **early hunger cues** — rooting, lip smacking, hand to mouth — before crying.',
      '- **Pace bottle feeds** so your baby can take breaks; this reduces gas and overfeeding.',
      '- **Cluster feeding** in the evening is common; offer milk on demand.',
      '- Track last feed time so the next caregiver knows the rhythm.',
      '',
      "Tell me your baby's age and I'll tailor the suggestions.",
    ].join('\n')
  }

  if (/sleep|nap|night|wake|wakes|drows/.test(q)) {
    return [
      'Sleep that actually helps:',
      '',
      '- Keep **wake windows** age-appropriate (overtired babies fight sleep harder).',
      '- Dim lights and lower noise about 20 minutes before sleep.',
      '- Aim for **drowsy but awake** put-downs when you can.',
      '- Around **4 months** a sleep regression is normal — frequent night wakings settle within a few weeks.',
      '',
      'Safe sleep basics: alone, on the back, flat surface, no loose bedding.',
    ].join('\n')
  }

  if (/milestone|month|grow|growth|develop/.test(q)) {
    return "Milestones vary a lot from baby to baby. If you share the age in months, I'll list what's typical for that range — motor, social, and language — and what to gently watch for. Always pair this with regular well-baby visits."
  }

  if (/invite|caregiver|family|relation|grandparent/.test(q)) {
    return [
      "Here's how family access works in MamtaAI:",
      '',
      '- The **primary parent** of a baby can invite caregivers from the **My Babies** page (the user-plus icon).',
      '- Each caregiver gets **Read-only** or **Full** access; you can change this any time in **Settings → Family access**.',
      '- A non-primary caregiver can leave a child profile from the child detail page.',
      '',
      'Need help with something specific? Tell me the step you are stuck on.',
    ].join('\n')
  }

  if (/insight|trend|weekly|chart|report/.test(q)) {
    return "Your **Insights** page summarizes the last 7 and 30 days: total cries, dominant cry type, and time-of-day patterns. If a week shows an **increasing** trend, look for a feeding or sleep change in the same week. If you tell me which baby you're asking about, I can talk through their last week."
  }

  return [
    "Great question — here's a calm, parent-friendly take:",
    '',
    'I would start by checking the basics in this order: **hunger**, **sleep pressure**, **comfort**, and **diaper**. Most fussy moments resolve once one of those is sorted.',
    '',
    "If something feels off (fever in a young infant, unusual sleepiness, breathing changes), don't wait — call your pediatrician.",
    '',
    "Want me to dig into one of these? Just say the word.",
  ].join('\n')
}

/**
 * Variable-speed character streamer that calls `onChunk` with new text
 * deltas and resolves when finished or cancelled.
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

export interface UseMockChatResult {
  messages: ChatMessage[]
  isStreaming: boolean
  sendMessage: (text: string) => void
  stop: () => void
  regenerate: () => void
  clear: () => void
  rateMessage: (id: string, value: 'up' | 'down' | null) => void
}

export function useMockChat(): UseMockChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [isStreaming, setIsStreaming] = useState(false)
  const cancelRef = useRef<{ cancelled: boolean } | null>(null)
  const lastUserRef = useRef<string>('')

  const finalize = useCallback((id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m)))
    setIsStreaming(false)
  }, [])

  const runAssistant = useCallback(
    async (assistantId: string, prompt: string) => {
      // Small initial "thinking" delay before tokens start arriving.
      await new Promise((r) => setTimeout(r, 450 + Math.random() * 450))

      if (cancelRef.current?.cancelled) {
        finalize(assistantId)
        return
      }

      const reply = pickMockReply(prompt)
      const cancelSignal = cancelRef.current!

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
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        isStreaming: true,
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      cancelRef.current = { cancelled: false }
      void runAssistant(assistantMsg.id, trimmed)
    },
    [isStreaming, runAssistant],
  )

  const stop = useCallback(() => {
    if (cancelRef.current) cancelRef.current.cancelled = true
  }, [])

  const regenerate = useCallback(() => {
    if (isStreaming) return
    const lastPrompt = lastUserRef.current
    if (!lastPrompt) return
    setMessages((prev) => {
      // Drop the trailing assistant message (if any) and stream a fresh one.
      const idxLastAssistant = [...prev].reverse().findIndex((m) => m.role === 'assistant')
      if (idxLastAssistant === -1) return prev
      const realIdx = prev.length - 1 - idxLastAssistant
      const next = prev.slice(0, realIdx)
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        isStreaming: true,
      }
      cancelRef.current = { cancelled: false }
      setIsStreaming(true)
      void runAssistant(assistantMsg.id, lastPrompt)
      return [...next, assistantMsg]
    })
  }, [isStreaming, runAssistant])

  const clear = useCallback(() => {
    if (cancelRef.current) cancelRef.current.cancelled = true
    setIsStreaming(false)
    setMessages([{ ...WELCOME, id: 'welcome-' + uid(), createdAt: Date.now() }])
  }, [])

  const rateMessage = useCallback((id: string, value: 'up' | 'down' | null) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, feedback: m.feedback === value ? null : value } : m,
      ),
    )
  }, [])

  // If the component unmounts mid-stream, cancel.
  useEffect(() => {
    return () => {
      if (cancelRef.current) cancelRef.current.cancelled = true
    }
  }, [])

  return { messages, isStreaming, sendMessage, stop, regenerate, clear, rateMessage }
}
