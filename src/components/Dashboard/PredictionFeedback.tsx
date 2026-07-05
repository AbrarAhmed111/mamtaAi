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

export default function PredictionFeedback({ recordingId, predictedCryType }: Props) {
  const [state, setState] = useState<'idle' | 'selecting' | 'submitting' | 'done'>('idle')
  const [selected, setSelected] = useState('')

  const submitFeedback = async (correctedCryType: string) => {
    setState('submitting')
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
      toast.success('Thanks! Your correction helps improve the model.')
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
      {state === 'idle' && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600 font-medium">Was this prediction correct?</p>
          <div className="flex gap-2">
            <button
              onClick={() => submitFeedback(predictedCryType)}
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

      {(state === 'selecting' || state === 'submitting') && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 font-medium">What was your baby actually doing?</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CRY_TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSelected(value)}
                disabled={state === 'submitting'}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selected === value
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setState('idle'); setSelected('') }}
              disabled={state === 'submitting'}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => selected && submitFeedback(selected)}
              disabled={!selected || state === 'submitting'}
              className="px-4 py-1.5 rounded-lg bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 disabled:opacity-40 transition-colors"
            >
              {state === 'submitting' ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
