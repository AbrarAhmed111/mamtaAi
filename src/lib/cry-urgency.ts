export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * Server-side urgency (same rules as persisted cry_predictions.urgency_level).
 * Uses cry type context (e.g. pain) plus model confidence — not shown as a numeric threshold to users.
 */
export function deriveUrgencyFromCryAndConfidence(
  cryType: string,
  confidenceScore: number | null | undefined,
): { level: UrgencyLevel; meterPercent: number } {
  const c = confidenceScore == null || Number.isNaN(Number(confidenceScore)) ? 0 : Number(confidenceScore)
  const t = String(cryType || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  const painLike =
    /pain|hurt|distress|scream|sick|emergency|severe|injury|unwell|ill|temperature_fever|fever/.test(t) ||
    t.includes('pain')

  let level: UrgencyLevel
  if (painLike) {
    if (c >= 0.72) level = 'critical'
    else if (c >= 0.42) level = 'high'
    else level = 'medium'
  } else if (c >= 0.88) level = 'high'
  else if (c >= 0.58) level = 'medium'
  else level = 'low'

  const meterPercent =
    level === 'critical' ? 92 : level === 'high' ? 76 : level === 'medium' ? 48 : 18

  return { level, meterPercent }
}

export function serverModelConfidenceThreshold(): number {
  const raw = process.env.MODEL_CONFIDENCE_THRESHOLD
  if (raw === undefined || String(raw).trim() === '') return 0.5
  const n = Number(String(raw).trim())
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.5
}
