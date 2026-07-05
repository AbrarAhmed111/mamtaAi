'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, BookOpen, ExternalLink, Heart } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import OximeterAlertSettingsConfirmModal, {
  type OximeterAlertSettingsModalKind,
} from '@/components/babies/OximeterAlertSettingsConfirmModal'
import {
  DEFAULT_BABY_OXIMETER_ALERTS,
  OXIMETER_ALERT_BOUNDS,
  sanitizeBabyOximeterAlerts,
  type BabyOximeterAlerts,
} from '@/lib/oximeter/baby-thresholds'
import {
  getOximeterAlertLimitErrors,
  getOximeterAlertLimitWarnings,
} from '@/lib/oximeter/alert-limits-warnings'
import {
  PEDIATRIC_VITALS_REFERENCE,
  PEDIATRIC_VITALS_REFERENCE_PAGE,
} from '@/lib/oximeter/pediatric-vitals-reference'

type Props = {
  babyId: string
  canEdit: boolean
  onSaved?: (alerts: BabyOximeterAlerts) => void
}

type PendingModal = {
  kind: OximeterAlertSettingsModalKind
  warnings?: string[]
}

function isFieldOutOfRange(key: keyof BabyOximeterAlerts, value: number): boolean {
  if (key === 'enabled') return false
  if (key === 'spo2Min' || key === 'spo2Max') {
    return value < OXIMETER_ALERT_BOUNDS.spo2.min || value > OXIMETER_ALERT_BOUNDS.spo2.max
  }
  return value < OXIMETER_ALERT_BOUNDS.pulse.min || value > OXIMETER_ALERT_BOUNDS.pulse.max
}

function fieldClass(invalid: boolean, tone: 'teal' | 'rose'): string {
  const base =
    tone === 'teal'
      ? 'w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-60'
      : 'w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-60'
  if (invalid) {
    return `${base} border-red-300 focus:ring-red-200`
  }
  return tone === 'teal'
    ? `${base} border-teal-200 focus:ring-teal-300`
    : `${base} border-rose-200 focus:ring-rose-300`
}

export default function BabyOximeterThresholdsSection({
  babyId,
  canEdit,
  onSaved,
}: Props) {
  const [alerts, setAlerts] = useState<BabyOximeterAlerts>(DEFAULT_BABY_OXIMETER_ALERTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingModal, setPendingModal] = useState<PendingModal | null>(null)

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/babies/${babyId}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to load oximeter alert settings')
        return
      }
      const next = sanitizeBabyOximeterAlerts(data?.oximeterAlerts ?? DEFAULT_BABY_OXIMETER_ALERTS)
      setAlerts(next)
    } finally {
      setLoading(false)
    }
  }, [babyId])

  useEffect(() => {
    void loadAlerts()
  }, [loadAlerts])

  const setNum = (key: keyof BabyOximeterAlerts, value: string) => {
    if (key === 'enabled') return
    const n = Number(value)
    setAlerts(prev => ({ ...prev, [key]: Number.isFinite(n) ? n : prev[key] }))
  }

  const persistAlerts = async (payload: BabyOximeterAlerts): Promise<boolean> => {
    try {
      setSaving(true)
      const res = await fetch(`/api/babies/${babyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oximeter_alerts: payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Failed to save oximeter alert settings')
        return false
      }
      const saved = sanitizeBabyOximeterAlerts(
        data?.oximeterAlerts != null ? data.oximeterAlerts : payload,
      )
      setAlerts(saved)
      toast.success('Oximeter alert limits saved')
      onSaved?.(saved)
      window.dispatchEvent(
        new CustomEvent('mamta:baby-oximeter-alerts-updated', {
          detail: { babyId, alerts: saved },
        }),
      )
      return true
    } catch {
      toast.error('Network error while saving oximeter alert settings')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAlerts = () => {
    if (!canEdit) return
    if (alerts.enabled) {
      setPendingModal({ kind: 'disable-toggle' })
      return
    }
    setAlerts(prev => ({ ...prev, enabled: true }))
  }

  const handleSaveClick = () => {
    const errors = getOximeterAlertLimitErrors(alerts)
    if (errors.length > 0) {
      setPendingModal({ kind: 'invalid-limits', warnings: errors })
      return
    }
    if (!alerts.enabled) {
      setPendingModal({ kind: 'save-disabled' })
      return
    }
    const warnings = getOximeterAlertLimitWarnings(alerts)
    if (warnings.length > 0) {
      setPendingModal({ kind: 'unusual-limits', warnings })
      return
    }
    void persistAlerts(alerts)
  }

  const handleModalConfirm = async () => {
    const payload = alerts
    if (pendingModal?.kind === 'disable-toggle') {
      const previousAlerts = alerts
      const nextAlerts = { ...alerts, enabled: false }
      setAlerts(nextAlerts)
      setPendingModal(null)
      const ok = await persistAlerts(nextAlerts)
      if (!ok) setAlerts(previousAlerts)
      return
    }
    const ok = await persistAlerts(payload)
    if (ok) setPendingModal(null)
  }

  const handleModalCancel = () => {
    setPendingModal(null)
  }

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm bg-gradient-to-br from-white to-pink-50/20">
      {loading ? (
        <p className="text-sm text-gray-500">Loading oximeter alert settings…</p>
      ) : (
        <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Oximeter Alert Limits
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Set min/max SpO₂ and pulse for this baby. If readings stay outside these limits for 5
            seconds, MumtaAI alerts you with sound, in-app notification, email, and a modal.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 rounded-full border border-pink-200 bg-pink-50/60 px-3.5 py-2">
          <span
            id="oximeter-alerts-enabled-label"
            className="whitespace-nowrap text-sm font-medium text-gray-800"
          >
            Alerts enabled
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={alerts.enabled}
            aria-labelledby="oximeter-alerts-enabled-label"
            disabled={!canEdit}
            onClick={handleToggleAlerts}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              alerts.enabled ? 'bg-pink-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                alerts.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/70 via-pink-50/50 to-white p-4">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-sm">
            <BookOpen className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Check age-appropriate ranges first</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Before setting min/max limits, review the{' '}
              <span className="font-medium text-pink-700">{PEDIATRIC_VITALS_REFERENCE.title}</span>{' '}
              for healthy SpO₂ and heart rate ranges by your child&apos;s age. This helps you choose
              alert thresholds that match what is normal for them—not adult values.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={PEDIATRIC_VITALS_REFERENCE_PAGE}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-pink-700 ring-1 ring-pink-200 transition hover:bg-pink-50"
              >
                <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} />
                View reference chart
              </Link>
              <a
                href={PEDIATRIC_VITALS_REFERENCE.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-200 transition hover:bg-purple-50"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} />
                Open PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-teal-800">
            <Activity className="h-4 w-4" strokeWidth={2.2} />
            <span className="text-sm font-semibold">Oxygen saturation (SpO₂ %)</span>
          </div>
          <p className="mb-3 text-xs text-teal-800/80">
            Percentage only — allowed range {OXIMETER_ALERT_BOUNDS.spo2.min}–
            {OXIMETER_ALERT_BOUNDS.spo2.max}%
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Minimum</label>
              <input
                type="number"
                min={OXIMETER_ALERT_BOUNDS.spo2.min}
                max={OXIMETER_ALERT_BOUNDS.spo2.max}
                disabled={!canEdit}
                value={alerts.spo2Min}
                onChange={e => setNum('spo2Min', e.target.value)}
                className={fieldClass(isFieldOutOfRange('spo2Min', alerts.spo2Min), 'teal')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Maximum</label>
              <input
                type="number"
                min={OXIMETER_ALERT_BOUNDS.spo2.min}
                max={OXIMETER_ALERT_BOUNDS.spo2.max}
                disabled={!canEdit}
                value={alerts.spo2Max}
                onChange={e => setNum('spo2Max', e.target.value)}
                className={fieldClass(isFieldOutOfRange('spo2Max', alerts.spo2Max), 'teal')}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-rose-800">
            <Heart className="h-4 w-4" strokeWidth={2.2} />
            <span className="text-sm font-semibold">Heart rate (BPM)</span>
          </div>
          <p className="mb-3 text-xs text-rose-800/80">
            Beats per minute — allowed range {OXIMETER_ALERT_BOUNDS.pulse.min}–
            {OXIMETER_ALERT_BOUNDS.pulse.max} BPM (not 500 or 1000)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Minimum</label>
              <input
                type="number"
                min={OXIMETER_ALERT_BOUNDS.pulse.min}
                max={OXIMETER_ALERT_BOUNDS.pulse.max}
                disabled={!canEdit}
                value={alerts.pulseMin}
                onChange={e => setNum('pulseMin', e.target.value)}
                className={fieldClass(isFieldOutOfRange('pulseMin', alerts.pulseMin), 'rose')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Maximum</label>
              <input
                type="number"
                min={OXIMETER_ALERT_BOUNDS.pulse.min}
                max={OXIMETER_ALERT_BOUNDS.pulse.max}
                disabled={!canEdit}
                value={alerts.pulseMax}
                onChange={e => setNum('pulseMax', e.target.value)}
                className={fieldClass(isFieldOutOfRange('pulseMax', alerts.pulseMax), 'rose')}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Defaults: SpO₂ {DEFAULT_BABY_OXIMETER_ALERTS.spo2Min}–{DEFAULT_BABY_OXIMETER_ALERTS.spo2Max}%,
        pulse {DEFAULT_BABY_OXIMETER_ALERTS.pulseMin}–{DEFAULT_BABY_OXIMETER_ALERTS.pulseMax} BPM.
        Alerts repeat at most once per minute per limit type while out of range.
      </p>

      {canEdit ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSaveClick()}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-pink-600 hover:to-rose-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Alert Limits'}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-gray-500">Only caregivers with edit access can change these limits.</p>
      )}

      <OximeterAlertSettingsConfirmModal
        open={pendingModal != null}
        kind={pendingModal?.kind ?? 'disable-toggle'}
        warnings={pendingModal?.warnings}
        submitting={saving}
        onConfirm={() => void handleModalConfirm()}
        onCancel={handleModalCancel}
      />
        </>
      )}
    </section>
  )
}
