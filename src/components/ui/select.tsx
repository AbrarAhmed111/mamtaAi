'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { FaCheck, FaChevronDown } from 'react-icons/fa'
import clsx from 'clsx'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectProps = {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  name?: string
  className?: string
  triggerClassName?: string
  invalid?: boolean
  size?: 'sm' | 'md'
  onBlur?: () => void
  'aria-label'?: string
}

const SIZE_CLASSES = {
  sm: 'min-h-[2rem] px-2.5 py-1 text-xs',
  md: 'min-h-[2.75rem] px-3.5 py-2 text-sm',
} as const

export default function Select({
  value: valueProp,
  defaultValue = '',
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  required = false,
  id,
  name,
  className,
  triggerClassName,
  invalid = false,
  size = 'md',
  onBlur,
  'aria-label': ariaLabel,
}: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const listboxId = `${selectId}-listbox`

  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = isControlled ? valueProp : internalValue

  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find(o => o.value === value)
  const displayLabel = selectedOption?.label ?? (value ? value : placeholder)
  const hasValue = Boolean(selectedOption)

  const enabledOptions = options.filter(o => !o.disabled)

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  const close = useCallback(() => {
    setOpen(false)
    setHighlightIndex(-1)
    onBlur?.()
  }, [onBlur])

  const openMenu = useCallback(() => {
    if (disabled) return
    setOpen(true)
    const idx = enabledOptions.findIndex(o => o.value === value)
    setHighlightIndex(idx >= 0 ? idx : 0)
  }, [disabled, enabledOptions, value])

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setMenuStyle({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updateMenuPosition()
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => updateMenuPosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        rootRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return
      }
      close()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  useEffect(() => {
    if (!open || highlightIndex < 0) return
    const el = listRef.current?.children[highlightIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, highlightIndex])

  const pickOption = (option: SelectOption) => {
    if (option.disabled) return
    setValue(option.value)
    close()
    triggerRef.current?.focus()
  }

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
    }

    if (e.key === 'ArrowDown') {
      if (!open) {
        openMenu()
        return
      }
      setHighlightIndex(i => Math.min(i + 1, enabledOptions.length - 1))
      return
    }

    if (e.key === 'ArrowUp') {
      if (!open) {
        openMenu()
        return
      }
      setHighlightIndex(i => Math.max(i - 1, 0))
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      if (!open) {
        openMenu()
        return
      }
      const option = enabledOptions[highlightIndex]
      if (option) pickOption(option)
      return
    }

    if (e.key === 'Escape' && open) {
      e.preventDefault()
      close()
    }
  }

  const menu =
    open && menuStyle && typeof document !== 'undefined'
      ? createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={selectId}
            style={{
              position: 'fixed',
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: 9999,
            }}
            className="max-h-60 overflow-y-auto rounded-xl border border-pink-100 bg-white py-1 shadow-lg shadow-pink-100/40"
          >
            {options.map(option => {
              const enabledIndex = enabledOptions.indexOf(option)
              const isSelected = option.value === value
              const isHighlighted = enabledIndex === highlightIndex

              return (
                <li
                  key={option.value === '' ? '__empty__' : option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => {
                    if (!option.disabled && enabledIndex >= 0) {
                      setHighlightIndex(enabledIndex)
                    }
                  }}
                  onClick={() => pickOption(option)}
                  className={clsx(
                    'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors',
                    option.disabled && 'cursor-not-allowed text-gray-400',
                    !option.disabled && isHighlighted && 'bg-pink-50 text-pink-700',
                    !option.disabled && !isHighlighted && 'text-gray-700 hover:bg-pink-50/70',
                    isSelected && !option.disabled && 'font-medium text-pink-700',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && !option.disabled && (
                    <FaCheck className="shrink-0 text-xs text-pink-500" aria-hidden />
                  )}
                </li>
              )
            })}
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={clsx('relative w-full', className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        onBlur={() => {
          if (!open) onBlur?.()
        }}
        className={clsx(
          'flex w-full items-center justify-between gap-2 rounded-xl border bg-white text-left transition-all',
          SIZE_CLASSES[size],
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
            : invalid
              ? 'border-red-500 text-gray-900 hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-500'
              : 'border-pink-200 text-gray-900 hover:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-300',
          !hasValue && !disabled && 'text-gray-500',
          open && !disabled && 'border-pink-300 ring-2 ring-pink-400/40',
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <FaChevronDown
          className={clsx(
            'shrink-0 text-[10px] text-pink-400 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {menu}
    </div>
  )
}
