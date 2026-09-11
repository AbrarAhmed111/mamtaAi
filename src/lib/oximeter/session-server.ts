import type { SupabaseClient } from '@supabase/supabase-js'

export type OximeterSessionRow = {
  id: string
  user_id: string
  baby_id: string
  device_row_id: string | null
  started_at: string
  ended_at: string | null
  min_spo2: number | null
  max_spo2: number | null
  avg_spo2: number | null
  min_pulse: number | null
  max_pulse: number | null
  avg_pulse: number | null
  reading_count: number
  status: string
  end_reason: string | null
}

export async function getActiveSessionForUser(
  supabase: SupabaseClient,
  userId: string,
  babyId?: string,
): Promise<OximeterSessionRow | null> {
  let q = supabase
    .from('oximeter_sessions' as 'oximeter_readings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
  if (babyId) q = q.eq('baby_id', babyId)
  const { data } = await q.maybeSingle()
  return (data as OximeterSessionRow | null) ?? null
}

export async function updateSessionStats(
  supabase: SupabaseClient,
  sessionId: string,
  spo2: number,
  pulse: number,
): Promise<void> {
  const { data: session } = await supabase
    .from('oximeter_sessions' as 'oximeter_readings')
    .select('min_spo2, max_spo2, avg_spo2, min_pulse, max_pulse, avg_pulse, reading_count')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return
  const row = session as {
    min_spo2: number | null
    max_spo2: number | null
    avg_spo2: number | null
    min_pulse: number | null
    max_pulse: number | null
    avg_pulse: number | null
    reading_count: number
  }

  const count = (row.reading_count ?? 0) + 1
  const prevAvgSpo2 = row.avg_spo2 ?? spo2
  const prevAvgPulse = row.avg_pulse ?? pulse
  const avg_spo2 = Math.round(((prevAvgSpo2 * (count - 1) + spo2) / count) * 100) / 100
  const avg_pulse = Math.round(((prevAvgPulse * (count - 1) + pulse) / count) * 100) / 100

  await supabase
    .from('oximeter_sessions' as 'oximeter_readings')
    .update({
      min_spo2: row.min_spo2 == null ? spo2 : Math.min(row.min_spo2, spo2),
      max_spo2: row.max_spo2 == null ? spo2 : Math.max(row.max_spo2, spo2),
      avg_spo2,
      min_pulse: row.min_pulse == null ? pulse : Math.min(row.min_pulse, pulse),
      max_pulse: row.max_pulse == null ? pulse : Math.max(row.max_pulse, pulse),
      avg_pulse,
      reading_count: count,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', sessionId)
}
