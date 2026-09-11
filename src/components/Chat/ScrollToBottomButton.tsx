'use client'

import { FaArrowDown } from 'react-icons/fa'

interface ScrollToBottomButtonProps {
  onClick: () => void
}

export default function ScrollToBottomButton({ onClick }: ScrollToBottomButtonProps) {
  return (
    <div className="pointer-events-none sticky bottom-2 flex justify-end pr-1">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-pink-200 bg-white/95 px-3 text-xs font-medium text-pink-600 shadow-lg backdrop-blur transition-all hover:bg-white"
        aria-label="Scroll to latest message"
      >
        <FaArrowDown className="text-[10px]" />
        New
      </button>
    </div>
  )
}
