'use client'

import { useEffect } from 'react'
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa'
import Link from 'next/link'
import { PEDIATRIC_VITALS_REFERENCE_PAGE } from '@/lib/oximeter/pediatric-vitals-reference'

export type OximeterAlertSettingsModalKind =
  | 'disable-toggle'
  | 'save-disabled'
  | 'unusual-limits'
  | 'invalid-limits'

type Props = {
  open: boolean
  kind: OximeterAlertSettingsModalKind
  warnings?: string[]
  submitting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const COPY: Record<
  OximeterAlertSettingsModalKind,
  { title: string; description: string; confirm: string; cancel: string }
> = {
  'disable-toggle': {
    title: 'Turn off oximeter alerts?',
    description:
      'MumtaAI will not sound, email, or show in-app alerts when readings stay outside your limits. You can turn alerts back on anytime.',
    confirm: 'Turn off alerts',
    cancel: 'Keep alerts on',
  },
  'save-disabled': {
    title: 'Save with alerts turned off?',
    description:
      'These limits will be saved, but MumtaAI will not notify you when SpO₂ or pulse goes out of range until you enable alerts again.',
    confirm: 'Save anyway',
    cancel: 'Go back',
  },
  'unusual-limits': {
    title: 'These alert limits look unusual',
    description:
      'The values you entered may cause missed emergencies or frequent false alarms. Review the pediatric reference chart and adjust if needed.',
    confirm: 'Save anyway',
    cancel: 'Review limits',
  },
  'invalid-limits': {
    title: 'These values cannot be saved',
    description:
      'Oximeter limits use real medical units: SpO₂ is a percentage (50–100%) and pulse is heart rate in BPM (30–250). Numbers like 500 or 1000 are outside what a pulse oximeter can measure.',
    confirm: '',
    cancel: 'Fix values',
  },
}

export default function OximeterAlertSettingsConfirmModal({
  open,
  kind,
  warnings = [],
  submitting = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onCancel])

  if (!open) return null

  const copy = COPY[kind]
  const isDanger = kind === 'disable-toggle' || kind === 'save-disabled'
  const isInvalid = kind === 'invalid-limits'
  const showIssueList =
    (kind === 'unusual-limits' || kind === 'invalid-limits') && warnings.length > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oximeter-settings-modal-title"
    >
      <button
        type="button"
        aria-label="Close"
        disabled={submitting}
        onClick={onCancel}
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-pink-100 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
        >
          <FaTimes className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-7">
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
              isInvalid
                ? 'bg-red-100 text-red-600'
                : isDanger
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-rose-100 text-rose-600'
            }`}
          >
            <FaExclamationTriangle className="h-5 w-5" />
          </div>
          <h2 id="oximeter-settings-modal-title" className="text-center text-xl font-bold text-gray-900">
            {copy.title}
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-gray-600">{copy.description}</p>

          {showIssueList ? (
            <ul
              className={`mt-4 max-h-48 space-y-2 overflow-y-auto rounded-xl border px-4 py-3 text-left text-sm ${
                isInvalid
                  ? 'border-red-100 bg-red-50/60 text-red-900'
                  : 'border-rose-100 bg-rose-50/60 text-rose-900'
              }`}
            >
              {warnings.map(w => (
                <li key={w} className="flex gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isInvalid ? 'bg-red-500' : 'bg-rose-500'}`}
                    aria-hidden
                  />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {kind === 'unusual-limits' ? (
            <p className="mt-4 text-center text-xs text-gray-500">
              <Link href={PEDIATRIC_VITALS_REFERENCE_PAGE} className="font-semibold text-pink-700 hover:underline">
                View pediatric vitals reference
              </Link>
            </p>
          ) : null}

          <div className={`mt-6 flex flex-col-reverse gap-3 ${isInvalid ? '' : 'sm:flex-row sm:justify-center'}`}>
            {isInvalid ? (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:from-pink-600 hover:to-rose-600"
              >
                {copy.cancel}
              </button>
            ) : (
              <>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all disabled:cursor-wait disabled:opacity-70 ${
                isDanger
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
              }`}
            >
              {submitting ? 'Saving…' : copy.confirm}
            </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
