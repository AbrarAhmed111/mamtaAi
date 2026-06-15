import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { data, error } = await (supabaseAdmin as any)
    .from('recordings')
    .select(`
      id,
      baby_id,
      duration_seconds,
      recorded_at,
      created_at,
      babies:babies!recordings_baby_id_fkey ( name, avatar_url )
    `)
    .eq('recorded_by', auth.auth.user.id)
    .order('recorded_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    recordings: (data || []).map((recording: any) => ({
      id: recording.id,
      babyId: recording.baby_id,
      babyName: recording.babies?.name ?? null,
      durationSeconds: recording.duration_seconds,
      createdAt: recording.recorded_at ?? recording.created_at,
    })),
  })
}

