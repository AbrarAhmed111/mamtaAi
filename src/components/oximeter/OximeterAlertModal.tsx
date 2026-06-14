'use client'

import { FaExclamationTriangle, FaTimes } from 'react-icons/fa'
import { useOximeter } from '@/contexts/OximeterContext'

export default function OximeterAlertModal() {
  const { alertModal, closeAlertModal } = useOximeter()

  if (!alertModal?.open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl"
        role="alertdialog"
        aria-labelledby="oximeter-alert-title"
        aria-describedby="oximeter-alert-body"
      >
        <button
          type="button"
          onClick={closeAlertModal}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close alert"
        >
          <FaTimes />
        </button>

        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <FaExclamationTriangle className="text-xl" />
          </span>
          <div className="min-w-0 pr-6">
            <h2 id="oximeter-alert-title" className="text-xl font-bold text-gray-900">
              {alertModal.title}
            </h2>
            <p id="oximeter-alert-body" className="mt-2 text-sm leading-relaxed text-gray-700">
              {alertModal.body}
            </p>
            {alertModal.spo2 != null && alertModal.pulse != null && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                  SpO₂ {alertModal.spo2}%
                </span>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
                  Pulse {alertModal.pulse} BPM
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={closeAlertModal}
            className="rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  )
}
