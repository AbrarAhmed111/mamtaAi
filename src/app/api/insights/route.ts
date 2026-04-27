import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

type PredictionLite = {
  recording_id: string
  predicted_cry_type: string | null
  confidence_score: number | null
  urgency_level: string | null
}

export async function GET(_req: NextRequest) {
  try {
    const supabase: any = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          overview: null,
          totals: null,
          cryTypeDistribution: [],
          dailyTrend: [],
          hourlyTrend: [],
          babyBreakdown: [],
          recentHistory: [],
        },
        { status: 200 },
      )
    }

    const { data: memberships, error: memError } = await supabase
      .from('baby_parents')
      .select('baby_id, babies:babies!baby_parents_baby_id_fkey(name)')
      .eq('parent_id', user.id)
      .eq('invitation_status', 'accepted')
      .eq('can_view_history', true)

    if (memError) return NextResponse.json({ error: memError.message }, { status: 400 })
    const babyIds = Array.from(new Set((memberships || []).map((m: any) => m.baby_id).filter(Boolean)))

    if (!babyIds.length) {
      return NextResponse.json({
        overview: {
          recordingsToday: 0,
          minutesToday: 0,
          avgConfidenceToday: 0,
          urgentToday: 0,
        },
        totals: {
          babies: 0,
          recordings: 0,
          predictions: 0,
          recordingsLast7Days: 0,
        },
        cryTypeDistribution: [],
        dailyTrend: [],
        hourlyTrend: [],
        babyBreakdown: [],
        recentHistory: [],
      })
    }

    const { data: recordings, error: recError } = await supabase
      .from('recordings')
      .select('id,baby_id,recorded_at,duration_seconds,babies:babies!recordings_baby_id_fkey(name)')
      .in('baby_id', babyIds)
      .order('recorded_at', { ascending: false })
      .limit(1000)

    if (recError) return NextResponse.json({ error: recError.message }, { status: 400 })

    const recordingIds = (recordings || []).map((r: any) => r.id).filter(Boolean)

    let predictionByRecording = new Map<string, PredictionLite>()
    if (recordingIds.length) {
      const { data: predictions } = await supabase
        .from('cry_predictions')
        .select('recording_id,predicted_cry_type,confidence_score,urgency_level,created_at')
        .in('recording_id', recordingIds)
        .order('created_at', { ascending: false })
        .limit(2000)

      for (const p of (predictions || []) as any[]) {
        if (!predictionByRecording.has(p.recording_id)) {
          predictionByRecording.set(p.recording_id, {
            recording_id: p.recording_id,
            predicted_cry_type: p.predicted_cry_type || 'unknown',
            confidence_score:
              typeof p.confidence_score === 'number' ? p.confidence_score : Number(p.confidence_score || 0),
            urgency_level: p.urgency_level || 'low',
          })
        }
      }
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recs = (recordings || []) as any[]
    const todayRecs = recs.filter(r => new Date(r.recorded_at) >= startOfToday)
    const recsLast7Days = recs.filter(r => new Date(r.recorded_at) >= sevenDaysAgo)
    const recsLast14Days = recs.filter(r => new Date(r.recorded_at) >= fourteenDaysAgo)
    const recsLast30Days = recs.filter(r => new Date(r.recorded_at) >= thirtyDaysAgo)

    const minutesToday = todayRecs.reduce((sum, r) => sum + Number(r.duration_seconds || 0), 0) / 60
    const todayPredictions = todayRecs
      .map(r => predictionByRecording.get(r.id))
      .filter(Boolean) as PredictionLite[]
    const avgConfidenceToday =
      todayPredictions.length > 0
        ? todayPredictions.reduce((sum, p) => sum + Number(p.confidence_score || 0), 0) / todayPredictions.length
        : 0
    const urgentToday = todayPredictions.filter(p => ['high', 'critical'].includes(String(p.urgency_level))).length

    const typeCount = new Map<string, number>()
    recsLast30Days.forEach(r => {
      const p = predictionByRecording.get(r.id)
      const t = String(p?.predicted_cry_type || 'unknown')
      typeCount.set(t, (typeCount.get(t) || 0) + 1)
    })
    const cryTypeDistribution = Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    const dailyMap = new Map<string, number>()
    recsLast14Days.forEach(r => {
      const d = new Date(r.recorded_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1)
    })
    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const hourlyBuckets = new Array(24).fill(0)
    todayRecs.forEach(r => {
      const h = new Date(r.recorded_at).getHours()
      hourlyBuckets[h] = (hourlyBuckets[h] || 0) + 1
    })
    const hourlyTrend = hourlyBuckets.map((count, hour) => ({ hour, count }))

    const babyMap = new Map<string, { babyId: string; babyName: string; recordings: number; avgDuration: number }>()
    recsLast30Days.forEach(r => {
      const babyId = String(r.baby_id)
      const existing = babyMap.get(babyId) || {
        babyId,
        babyName: r.babies?.name || 'Unknown',
        recordings: 0,
        avgDuration: 0,
      }
      existing.recordings += 1
      existing.avgDuration += Number(r.duration_seconds || 0)
      babyMap.set(babyId, existing)
    })
    const babyBreakdown = Array.from(babyMap.values())
      .map(b => ({
        ...b,
        avgDuration: b.recordings ? b.avgDuration / b.recordings : 0,
      }))
      .sort((a, b) => b.recordings - a.recordings)

    const recentHistory = recs.slice(0, 25).map(r => {
      const p = predictionByRecording.get(r.id)
      return {
        id: r.id,
        babyId: r.baby_id,
        babyName: r.babies?.name || 'Unknown',
        recordedAt: r.recorded_at,
        durationSeconds: Number(r.duration_seconds || 0),
        cryType: p?.predicted_cry_type || 'unknown',
        confidence: Number(p?.confidence_score || 0),
        urgency: p?.urgency_level || 'low',
      }
    })

    return NextResponse.json({
      overview: {
        recordingsToday: todayRecs.length,
        minutesToday: Number(minutesToday.toFixed(1)),
        avgConfidenceToday: Number((avgConfidenceToday * 100).toFixed(1)),
        urgentToday,
      },
      totals: {
        babies: babyIds.length,
        recordings: recs.length,
        predictions: predictionByRecording.size,
        recordingsLast7Days: recsLast7Days.length,
      },
      cryTypeDistribution,
      dailyTrend,
      hourlyTrend,
      babyBreakdown,
      recentHistory,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

