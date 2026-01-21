import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type FeaturePayload = {
  features?: any
  extraction_time_ms?: number
  extraction_method?: string
  extraction_version?: string
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
      .select('id, recorded_by')
      .eq('id', recordingId)
      .single()
    if (recordingError || !recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }
    if (recording.recorded_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as FeaturePayload
    const features = body.features || {}
    const mfcc = features.mfcc || {}
    const pitch = features.pitch_frequency || {}
    const duration = features.duration || {}

    const mfccCoefficients = mfcc.mfcc_coefficients || mfcc.mfcc_mean || null
    const durationMs = duration.total_duration_seconds
      ? Math.round(Number(duration.total_duration_seconds) * 1000)
      : null

    const insert = {
      recording_id: recordingId,
      mfcc_coefficients: mfccCoefficients,
      pitch_hz_mean: toNumber(pitch.pitch_mean),
      pitch_hz_std: toNumber(pitch.pitch_std),
      pitch_hz_min: toNumber(pitch.pitch_min),
      pitch_hz_max: toNumber(pitch.pitch_max),
      dominant_frequency_hz: toNumber(pitch.dominant_frequency),
      spectral_centroid: toNumber(pitch.spectral_centroid_mean),
      zero_crossing_rate: toNumber(pitch.zero_crossing_rate_mean),
      duration_ms: durationMs,
      extraction_time_ms: body.extraction_time_ms ?? null,
      extraction_method: body.extraction_method ?? 'streaming',
      extraction_version: body.extraction_version ?? null,
      metadata: {
        mfcc_mean: mfcc.mfcc_mean || null,
        mfcc_std: mfcc.mfcc_std || null,
        mfcc_num_coefficients: mfcc.num_coefficients ?? null,
        mfcc_num_frames: mfcc.num_frames ?? null,
        duration_seconds: duration.total_duration_seconds ?? null,
        actual_audio_duration_seconds: duration.actual_audio_duration_seconds ?? null,
        silence_percentage: duration.silence_percentage ?? null,
      },
      created_at: new Date().toISOString(),
    }

    await supabase.from('extracted_features').delete().eq('recording_id', recordingId)
    const { data, error } = await supabase.from('extracted_features').insert(insert).select('id').single()
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

