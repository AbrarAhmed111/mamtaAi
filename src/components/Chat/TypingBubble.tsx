'use client'

import Image from 'next/image'
import logo from '@/assets/img/smallLogo.png'
import TypingIndicator from './TypingIndicator'
import { BOT_NAME, TYPING_INDICATOR_EMPTY_CONTENT } from './constants'

interface TypingBubbleProps {
  messageId: string
}

export default function TypingBubble({ messageId }: TypingBubbleProps) {
  return (
    <div key={messageId} className="flex w-full justify-start gap-2.5 animate-chat-message-in">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm">
        <Image src={logo} alt={BOT_NAME} width={20} height={20} className="rounded-full" />
      </div>
      <TypingIndicator />
    </div>
  )
}
