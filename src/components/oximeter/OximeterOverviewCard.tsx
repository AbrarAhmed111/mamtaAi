'use client'

import Link from 'next/link'
import { FaBluetooth, FaHeart, FaSignal } from 'react-icons/fa'
import { useOximeter } from '@/contexts/OximeterContext'
import { spo2StatusLabel } from '@/lib/oximeter/thresholds'
import { formatRelativeTime } from '@/lib/oximeter/stats'

export default function OximeterOverviewCard() {
  const {
    connection,
    liveReading,
    rawPacketCount,
    vitalsDecodeReady,
    openConnectModal,
    babies,
    babiesLoading,
  } = useOximeter()
  const connected = connection.status === 'connected' || connection.status === 'reconnecting'
  const decodePending = connected && (!vitalsDecodeReady || liveReading?.decodePending)
  const hasBabies = babies.length > 0
  const showAddBabyPrompt = !babiesLoading && !hasBabies

  const disconnectedDescription = babiesLoading
    ? 'Loading your baby profiles…'
    : hasBabies
      ? babies.length === 1
        ? `Connect your oximeter to track ${babies[0].name}'s oxygen and pulse in real time. Set alert limits on their profile.`
        : 'Connect your oximeter for live SpO₂ and pulse monitoring. Choose which baby is wearing the sensor when you connect.'
      : 'Add a baby profile first, then connect an oximeter for live monitoring.'

  return (
    <div className="rounded-3xl border border-pink-100/80 bg-white p-5 shadow-md shadow-pink-100/20 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              connected ? 'bg-emerald-50 text-emerald-600' : 'bg-pink-50 text-pink-600'
            }`}
          >
            <FaHeart />
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Oximeter Monitoring</h3>
            <p className="text-sm text-gray-500">
              {connected ? connection.deviceName : 'No oximeter connected'}
            </p>
          </div>
        </div>
        {connected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <FaSignal className="animate-pulse" />
            {connection.status === 'reconnecting' ? 'Reconnecting' : 'Connected'}
          </span>
        )}
      </div>

      {connected ? (
        decodePending ? (
          <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
            <p className="text-sm font-medium text-sky-900">Receiving binary packets</p>
            <p className="mt-1 text-xs text-sky-800">
              {rawPacketCount} packet{rawPacketCount === 1 ? '' : 's'} · vitals decode pending verification
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-medium text-emerald-700">SpO₂</p>
            <p className="text-2xl font-bold text-gray-900">
              {liveReading?.spo2 ?? '—'}
              {liveReading?.spo2 != null && <span className="text-base font-semibold">%</span>}
            </p>
            <p className="text-[11px] text-emerald-800 mt-1">
              {liveReading ? spo2StatusLabel(liveReading.spo2Status) : 'Waiting…'}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
            <p className="text-xs font-medium text-rose-700">Pulse</p>
            <p className="text-2xl font-bold text-gray-900">
              {liveReading?.pulseRate ?? '—'}
              {liveReading?.pulseRate != null && (
                <span className="text-base font-semibold"> BPM</span>
              )}
            </p>
            <p className="text-[11px] text-rose-800 mt-1">
              {formatRelativeTime(liveReading?.measuredAt)}
              {liveReading?.isStale ? ' · stale' : ''}
            </p>
          </div>
          </div>
        )
      ) : (
        <p className="mt-3 text-sm text-gray-600">{disconnectedDescription}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {connected ? (
          <Link
            href="/dashboard/oximeter"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700"
          >
            <FaBluetooth />
            View Live Readings
          </Link>
        ) : hasBabies ? (
          <button
            type="button"
            onClick={openConnectModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700"
          >
            <FaBluetooth />
            Connect Oximeter
          </button>
        ) : babiesLoading ? (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white opacity-60"
          >
            <FaBluetooth />
            Connect Oximeter
          </button>
        ) : showAddBabyPrompt ? (
          <Link
            href="/dashboard/babies/add-baby"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700"
          >
            <FaBluetooth />
            Add Baby to Connect
          </Link>
        ) : null}
      </div>
    </div>
  )
}
