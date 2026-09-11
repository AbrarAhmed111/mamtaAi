import { useEffect, useState } from 'react'
import { CLOSE_ANIMATION_DURATION, CLEAR_CONFIRM_TIMEOUT, MOBILE_BREAKPOINT } from './constants'

/**
 * Manages closing animation and subsequent panel close
 */
export const useCloseAnimation = (onClose: () => void) => {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!isClosing) return
    const timer = setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, CLOSE_ANIMATION_DURATION)
    return () => clearTimeout(timer)
  }, [isClosing, onClose])

  const handleClose = () => setIsClosing(true)

  return { isClosing, handleClose }
}

/**
 * Manages keyboard shortcuts and body scroll lock
 */
export const useKeyboardShortcuts = (open: boolean, handleClose: () => void) => {
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, handleClose])
}

/**
 * Manages clear confirmation state with auto-reset
 */
export const useClearConfirm = (shouldReset: boolean) => {
  const [confirmingClear, setConfirmingClear] = useState(false)

  useEffect(() => {
    if (shouldReset) setConfirmingClear(false)
  }, [shouldReset])

  const toggleConfirm = () => {
    if (!confirmingClear) {
      setConfirmingClear(true)
      setTimeout(() => setConfirmingClear(false), CLEAR_CONFIRM_TIMEOUT)
    }
  }

  return { confirmingClear, setConfirmingClear, toggleConfirm }
}

/**
 * Manages auto-scroll behavior
 */
export const useAutoScroll = (messages: any[], ref: React.RefObject<HTMLDivElement | null>) => {
  const [autoFollow, setAutoFollow] = useState(true)

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (!autoFollow) return
    const el = ref.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, autoFollow])

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
    setAutoFollow(distanceFromBottom < 80)
  }

  const scrollToBottom = () => {
    setAutoFollow(true)
    const el = ref.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  return { autoFollow, handleScroll, scrollToBottom }
}
