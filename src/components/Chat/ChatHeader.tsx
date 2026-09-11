'use client'

import Image from 'next/image'
import { FaTimes, FaTrashAlt } from 'react-icons/fa'
import logo from '@/assets/img/smallLogo.png'
import { BOT_NAME, BOT_STATUS } from './constants'

interface ChatHeaderProps {
  isStreaming: boolean
  hasMessages: boolean
  confirmingClear: boolean
  onClear: () => void
  onClose: () => void
}

export default function ChatHeader({
  isStreaming,
  hasMessages,
  confirmingClear,
  onClear,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="relative shrink-0 bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 px-4 py-3 text-white">
      <div className="flex items-center justify-between gap-3">
        {/* Logo and Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40 backdrop-blur">
              <Image src={logo} alt={BOT_NAME} width={26} height={26} className="rounded-full" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{BOT_NAME}</p>
            <p className="text-[11px] text-pink-50/90">
              {isStreaming ? BOT_STATUS.THINKING : BOT_STATUS.IDLE}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {hasMessages && (
            <button
              type="button"
              onClick={onClear}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs transition-all ${
                confirmingClear
                  ? 'bg-white text-pink-600'
                  : 'text-white/90 hover:bg-white/15'
              }`}
              title={confirmingClear ? 'Click again to confirm' : 'Clear chat'}
              aria-label="Clear chat"
            >
              <FaTrashAlt className="text-[11px]" />
              <span className="hidden sm:inline">{confirmingClear ? 'Confirm?' : 'Clear'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/15"
            aria-label="Close chat"
          >
            <FaTimes />
          </button>
        </div>
      </div>
    </div>
  )
}
