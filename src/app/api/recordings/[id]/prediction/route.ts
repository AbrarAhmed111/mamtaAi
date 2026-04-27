import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type PredictionPayload = {
  prediction?: any
  predicted_cry_type?: string
  confidence_score?: number
  confidence_scores?: Record<string, number>
  /** If omitted, defaults to 0.5 — should match UI `NEXT_PUBLIC_CRY_CONFIDENCE_THRESHOLD` when set */
  model_confidence_threshold?: number
  model_info?: {
    model_path?: string | null
    model_type?: string | null
    version?: string | null
  }
  inference_time_ms?: number
  total_processing_time_ms?: number
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: recordingId } = await params
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('id, recorded_by, baby_id, recorded_at')
      .eq('id', recordingId)
      .single()
    if (recordingError || !recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }
    if (recording.recorded_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as PredictionPayload
    const prediction = body.prediction || {}
    const predictedCryType = body.predicted_cry_type || prediction.predicted_cry_type
    if (!predictedCryType) {
      return NextResponse.json({ error: 'Missing predicted_cry_type' }, { status: 400 })
    }

    const confidenceScore = toNumber(body.confidence_score ?? prediction.confidence_score ?? null)
    const confidenceScoresRaw =
      body.confidence_scores || prediction.confidence_scores || prediction.all_predictions || null
    const confidenceScores = normalizeConfidenceScores(confidenceScoresRaw)

    const modelName = body.model_info?.model_type || 'baby_cry_classifier'
    const modelVersion = body.model_info?.version || '1.0.0'
    const urgencyLevel = deriveUrgencyLevel(confidenceScore)
    const urgencyScore = confidenceScore ?? 0
    const requiresImmediateAttention = urgencyLevel === 'high'
    const secondaryPredictions = buildSecondaryPredictions(predictedCryType, confidenceScores)

    const thresholdRaw = toNumber(
      body.model_confidence_threshold ??
        prediction.model_confidence_threshold ??
        prediction.confidence_threshold ??
        null,
    )
    const modelConfidenceThreshold =
      thresholdRaw !== null && thresholdRaw >= 0 && thresholdRaw <= 1 ? thresholdRaw : 0.5

    const [timeSince, babyAgeMonths] = await Promise.all([
      getTimeSinceActivities(supabase, recording.baby_id, recording.recorded_at),
      getBabyAgeMonths(supabase, recording.baby_id, recording.recorded_at),
    ])

    const insert = {
      recording_id: recordingId,
      predicted_cry_type: predictedCryType,
      confidence_score: confidenceScore,
      all_class_probabilities: confidenceScores || null,
      model_name: modelName,
      model_version: modelVersion,
      urgency_level: urgencyLevel,
      urgency_score: urgencyScore,
      requires_immediate_attention: requiresImmediateAttention,
      secondary_predictions: secondaryPredictions,
      baby_age_months: babyAgeMonths,
      time_since_last_feeding_minutes: timeSince.feedingMinutes,
      time_since_last_sleep_minutes: timeSince.sleepMinutes,
      inference_time_ms: body.inference_time_ms ?? null,
      total_processing_time_ms: body.total_processing_time_ms ?? null,
      model_confidence_threshold: modelConfidenceThreshold,
      medical_red_flags: [],
      suggested_actions: [],
      metadata: {
        model_path: body.model_info?.model_path || null,
      },
      created_at: new Date().toISOString(),
    }

    await supabase.from('cry_predictions').delete().eq('recording_id', recordingId)
    const { data, error } = await supabase.from('cry_predictions').insert(insert).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true, id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function deriveUrgencyLevel(confidenceScore: number | null) {
  if (confidenceScore === null || confidenceScore === undefined) return 'low'
  if (confidenceScore >= 0.8) return 'high'
  if (confidenceScore >= 0.5) return 'medium'
  return 'low'
}

function normalizeConfidenceScores(value: any): Record<string, number> | null {
  if (!value) return null
  if (Array.isArray(value)) {
    return value.reduce((acc: Record<string, number>, item: any) => {
      if (item?.cry_type && item?.confidence !== undefined) {
        acc[item.cry_type] = Number(item.confidence)
      }
      return acc
    }, {})
  }
  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc: Record<string, number>, [key, val]) => {
      const n = Number(val)
      if (!Number.isNaN(n)) acc[key] = n
      return acc
    }, {})
  }
  return null
}

function buildSecondaryPredictions(predicted: string, confidenceScores: Record<string, number> | null) {
  if (!confidenceScores) return []
  return Object.entries(confidenceScores)
    .filter(([label]) => label !== predicted)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 2)
    .map(([label, confidence]) => ({ cry_type: label, confidence: Number(confidence) }))
}

async function getTimeSinceActivities(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  babyId: string,
  recordedAt: string
) {
  const recordedAtDate = new Date(recordedAt)
  if (Number.isNaN(recordedAtDate.getTime())) {
    return { feedingMinutes: null, sleepMinutes: null }
  }

  const [feeding, sleep] = await Promise.all([
    supabase
      .from('baby_activities')
      .select('started_at')
      .eq('baby_id', babyId)
      .eq('activity_type', 'feeding')
      .lte('started_at', recordedAtDate.toISOString())
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('baby_activities')
      .select('started_at')
      .eq('baby_id', babyId)
      .eq('activity_type', 'sleep')
      .lte('started_at', recordedAtDate.toISOString())
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const feedingMinutes = feeding?.data?.started_at
    ? Math.round((recordedAtDate.getTime() - new Date(feeding.data.started_at).getTime()) / 60000)
    : null
  const sleepMinutes = sleep?.data?.started_at
    ? Math.round((recordedAtDate.getTime() - new Date(sleep.data.started_at).getTime()) / 60000)
    : null

  return {
    feedingMinutes: Number.isNaN(feedingMinutes) ? null : feedingMinutes,
    sleepMinutes: Number.isNaN(sleepMinutes) ? null : sleepMinutes,
  }
}

async function getBabyAgeMonths(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  babyId: string,
  recordedAt: string
) {
  const recordedAtDate = new Date(recordedAt)
  if (Number.isNaN(recordedAtDate.getTime())) return null

  const { data } = await supabase
    .from('babies')
    .select('birth_date')
    .eq('id', babyId)
    .single()

  if (!data?.birth_date) return null
  const birthDate = new Date(data.birth_date)
  if (Number.isNaN(birthDate.getTime())) return null

  const months =
    (recordedAtDate.getFullYear() - birthDate.getFullYear()) * 12 +
    (recordedAtDate.getMonth() - birthDate.getMonth())

  return months < 0 ? null : months
}

