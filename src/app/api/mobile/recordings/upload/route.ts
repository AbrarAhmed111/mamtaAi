import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireMobileAuth, requireMobileBabyAccess } from '@/lib/mobile/auth'
import { checkLimit, getPlanLimits, incrementUsage, planLimitErrorResponse } from '@/lib/subscription'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const form = await request.formData()
  const file = form.get('file') as File | null
  const babyId = String(form.get('babyId') || form.get('baby_id') || '')
  const durationSeconds = Number(form.get('durationSeconds') || form.get('duration_seconds') || 0)
  const source = String(form.get('source') || 'live') === 'uploaded' ? 'uploaded' : 'live'

  if (!file || !babyId) {
    return NextResponse.json({ error: 'Missing audio file or babyId' }, { status: 400 })
  }

  const access = await requireMobileBabyAccess(auth.auth.user.id, babyId)
  if (!access.ok) return access.response
  if (access.membership.can_record_audio === false) {
    return NextResponse.json({ error: 'You do not have permission to record for this baby' }, { status: 403 })
  }

  const timezone = auth.auth.profile?.timezone ?? null
  const planCtx = await getPlanLimits(auth.auth.user.id, timezone)
  const recordingLimit = await checkLimit(auth.auth.user.id, 'create_recording', {
    timezone,
    durationSeconds,
    recordingSource: source,
  })
  if (!recordingLimit.allowed) return planLimitErrorResponse(recordingLimit, planCtx.slug)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
  }

  const svc = createClient(supabaseUrl, serviceKey)
  const ext = (file.name?.split('.').pop() || 'm4a').toLowerCase()
  const path = `recordings/${auth.auth.user.id}/${babyId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await svc.storage
    .from('recordings')
    .upload(path, bytes, { upsert: true, contentType: file.type || `audio/${ext}` })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })

  const { data: pub } = svc.storage.from('recordings').getPublicUrl(path)
  if (!pub?.publicUrl) return NextResponse.json({ error: 'Failed to create recording URL' }, { status: 500 })

  const { data, error } = await (supabaseAdmin as any)
    .from('recordings')
    .insert({
      baby_id: babyId,
      recorded_by: auth.auth.user.id,
      file_url: pub.publicUrl,
      duration_seconds: durationSeconds || 1,
      file_format: ext === 'webm' ? 'ogg' : ext,
      source,
      device_type: 'mobile',
      recorded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select('id, file_url, duration_seconds, recorded_at, baby_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await incrementUsage(auth.auth.user.id, 'recordings_count', 1, timezone)

  return NextResponse.json({
    ok: true,
    recording: {
      id: data.id,
      fileUrl: data.file_url,
      durationSeconds: data.duration_seconds,
      babyId: data.baby_id,
      createdAt: data.recorded_at,
    },
  }, { status: 201 })
}

