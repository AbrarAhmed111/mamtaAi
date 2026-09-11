'use client'

import Image from 'next/image'
import logo from '@/assets/img/smallLogo.png'
import SuggestionChips from './SuggestionChips'
import { BOT_NAME, EMPTY_STATE_TITLE, EMPTY_STATE_DESCRIPTION } from './constants'

interface ChatEmptyStateProps {
  onSendMessage: (message: string) => void
}

export default function ChatEmptyState({ onSendMessage }: ChatEmptyStateProps) {
  return (
    <div className="mb-4 space-y-4 px-1">
      <div className="rounded-2xl border border-pink-100 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm">
            <Image src={logo} alt={BOT_NAME} width={22} height={22} className="rounded-full" />
          </div>
          <div className="text-sm leading-relaxed text-gray-700">
            <p className="font-semibold text-gray-900">{EMPTY_STATE_TITLE}</p>
            <p className="mt-0.5 text-gray-600">{EMPTY_STATE_DESCRIPTION}</p>
          </div>
        </div>
      </div>
      <SuggestionChips onPick={onSendMessage} />
    </div>
  )
}
