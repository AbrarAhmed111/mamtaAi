'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/sonner'

const CRY_TYPE_LABELS: Record<string, string> = {
  hungry: 'Hungry',
  tired: 'Tired',
  discomfort: 'Discomfort',
  pain: 'Pain',
  overstimulated: 'Overstimulated',
  diaper_change: 'Diaper Change',
  colic: 'Colic',
}

interface Props {
  recordingId: string
  predictedCryType: string
}

type State = 'idle' | 'confirming_yes' | 'confirming_yes_saving' | 'selecting' | 'submitting' | 'done'

// Normalize a free-text custom label to the model's snake_case convention
function normalizeLabel(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_')
}

export default function PredictionFeedback({ recordingId, predictedCryType }: Props) {
  const [state, setState] = useState<State>('idle')
  const [selected, setSelected] = useState('')
  const [customLabel, setCustomLabel] = useState('')

  // What actually gets submitted from the "No" path: custom text wins if present
  const effectiveLabel = customLabel.trim() ? normalizeLabel(customLabel) : selected

  const submitFeedback = async (correctedCryType: string, fromYesPath = false) => {
    if (!fromYesPath) setState('submitting')
    try {
      const res = await fetch(`/api/recordings/${recordingId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predicted_cry_type: predictedCryType,
          corrected_cry_type: correctedCryType,
        }),
      })
      if (!res.ok) throw new Error('Failed to save feedback')
      setState('done')
      toast.success('Thanks! Your feedback helps improve the model.')
    } catch {
      toast.error('Could not save feedback. Please try again.')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm text-green-700 font-medium">
        ✓ Feedback saved — thank you for helping us improve!
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      {/* Step 1 — initial yes/no */}
      {state === 'idle' && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600 font-medium">Was this prediction correct?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setState('confirming_yes')}
              className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-semibold hover:bg-green-200 transition-colors"
            >
              👍 Yes
            </button>
            <button
              onClick={() => setState('selecting')}
              className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-colors"
            >
              👎 No
            </button>
          </div>
        </div>
      )}

      {/* Step 2a — confirm correct prediction */}
      {(state === 'confirming_yes' || state === 'confirming_yes_saving') && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 font-medium">
            Great! Confirm the prediction was <span className="font-bold text-gray-800 capitalize">{CRY_TYPE_LABELS[predictedCryType] ?? predictedCryType}</span>?
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setState('idle')}
              disabled={state === 'confirming_yes_saving'}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => { setState('confirming_yes_saving'); submitFeedback(predictedCryType, true) }}
              disabled={state === 'confirming_yes_saving'}
              className="px-4 py-1.5 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-60 transition-colors"
            >
              {state === 'confirming_yes_saving' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2b — pick correct label (or write a custom one) */}
      {(state === 'selecting' || state === 'submitting') && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 font-medium">What was your baby actually doing?</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CRY_TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => { setSelected(value); setCustomLabel('') }}
                disabled={state === 'submitting'}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selected === value && !customLabel.trim()
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom label input */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">
              Or add your own custom label
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => { setCustomLabel(e.target.value); if (e.target.value.trim()) setSelected('') }}
              disabled={state === 'submitting'}
              placeholder="e.g. gassy, teething, wants cuddles"
              maxLength={40}
              className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-pink-400 transition-colors disabled:opacity-60"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setState('idle'); setSelected(''); setCustomLabel('') }}
              disabled={state === 'submitting'}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => effectiveLabel && submitFeedback(effectiveLabel)}
              disabled={!effectiveLabel || state === 'submitting'}
              className="px-4 py-1.5 rounded-lg bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 disabled:opacity-40 transition-colors"
            >
              {state === 'submitting' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
