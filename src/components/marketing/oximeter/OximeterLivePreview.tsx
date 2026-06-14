'use client'

import { useEffect, useState } from 'react'
import { FaBluetooth, FaHeart, FaSignal, FaWifi } from 'react-icons/fa'

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function OximeterLivePreview() {
  const [spo2, setSpo2] = useState(98)
  const [pulse, setPulse] = useState(72)
  const [pi, setPi] = useState(3.5)
  const [seconds, setSeconds] = useState(124)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSpo2(v => {
        const next = v + (Math.random() > 0.5 ? 1 : -1)
        return Math.min(99, Math.max(96, next))
      })
      setPulse(v => {
        const next = v + (Math.random() > 0.5 ? 1 : -1)
        return Math.min(78, Math.max(68, next))
      })
      setPi(v => {
        const next = Math.round((v + (Math.random() > 0.6 ? 0.1 : -0.1)) * 10) / 10
        return Math.min(4.2, Math.max(2.8, next))
      })
      setSeconds(s => s + 1)
    }, 2200)
    return () => window.clearInterval(interval)
  }, [])

  const heartDuration = 60 / pulse

  return (
    <div className="rounded-3xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/60 p-5 sm:p-6 shadow-xl shadow-pink-100/40">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Live preview</p>
          <p className="text-sm font-bold text-gray-900">Oximeter Monitoring</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Connected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <p className="text-xs font-medium text-emerald-700">SpO₂</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#d1fae5" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray={`${spo2} 100`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-emerald-800">
                {spo2}
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 transition-all duration-700">{spo2}%</p>
              <p className="text-xs text-emerald-800">Normal</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
          <p className="text-xs font-medium text-rose-700">Pulse</p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600"
              style={{ animation: `oxi-preview-heart ${heartDuration}s ease-in-out infinite` }}
            >
              <FaHeart />
            </span>
            <div>
              <p className="text-3xl font-bold text-gray-900 transition-all duration-700">{pulse}</p>
              <p className="text-xs text-rose-800">BPM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {[
          { label: 'PI', value: `${pi}%` },
          { label: 'Signal', value: 'Strong', icon: FaSignal },
          { label: 'Session', value: formatTimer(seconds) },
          { label: 'Min SpO₂', value: '96%' },
        ].map(item => (
          <div key={item.label} className="rounded-xl bg-white/80 border border-pink-50 px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="text-sm font-bold text-gray-900 flex items-center justify-center gap-1">
              {item.icon ? <item.icon className="text-pink-400 text-xs animate-pulse" /> : null}
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-white/70 py-2 border border-gray-100">
          <p className="text-gray-500">Max SpO₂</p>
          <p className="font-bold text-gray-900">99%</p>
        </div>
        <div className="rounded-lg bg-white/70 py-2 border border-gray-100">
          <p className="text-gray-500">Avg SpO₂</p>
          <p className="font-bold text-gray-900">97%</p>
        </div>
        <div className="rounded-lg bg-white/70 py-2 border border-gray-100">
          <p className="text-gray-500">Avg Pulse</p>
          <p className="font-bold text-gray-900">71 BPM</p>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-500">
        <FaBluetooth className="text-pink-400" />
        <FaWifi className="text-pink-300 animate-pulse" />
        Illustrative preview — values animate for demonstration
      </p>

      <style jsx>{`
        @keyframes oxi-preview-heart {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  )
}
