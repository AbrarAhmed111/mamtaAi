'use client'

import { FaBaby, FaBed, FaQuestion, FaUserPlus } from 'react-icons/fa'
import type { ChatSuggestion } from './types'

const SUGGESTIONS: (ChatSuggestion & { icon: React.ComponentType<{ className?: string }> })[] = [
  {
    label: 'Why is my baby crying?',
    prompt: 'Why might my baby be crying right now?',
    icon: FaBaby,
  },
  {
    label: 'Sleep tips for 4 months',
    prompt: 'What are good sleep tips for a 4-month-old?',
    icon: FaBed,
  },
  {
    label: 'How do I add a caregiver?',
    prompt: 'How do I invite a family caregiver in MamtaAI?',
    icon: FaUserPlus,
  },
  {
    label: 'Explain my weekly insight',
    prompt: 'Can you explain what my weekly insight means?',
    icon: FaQuestion,
  },
]

export default function SuggestionChips({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {SUGGESTIONS.map((s) => {
        const Icon = s.icon
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-pink-100 bg-white/80 p-3 text-left text-sm text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600 transition-colors group-hover:from-pink-200 group-hover:to-rose-200">
              <Icon className="text-sm" />
            </span>
            <span className="leading-snug">{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}
