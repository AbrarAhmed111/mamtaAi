import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await request.formData()
    const file = form.get('file') as File | null
    const babyId = String(form.get('baby_id') || '')
    const duration = Number(form.get('duration_seconds') || 0)

    if (!file || !babyId) {
      return NextResponse.json({ error: 'Missing audio file or baby_id' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }
    const svc = createClient(supabaseUrl, serviceKey)

    const ext = (file.name?.split('.').pop() || 'webm').toLowerCase()
    const path = `recordings/${user.id}/${babyId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadErr } = await svc.storage
      .from('recordings')
      .upload(path, file, { upsert: true, contentType: file.type || `audio/${ext}` })
    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 400 })
    }
    const { data: pub } = svc.storage.from('recordings').getPublicUrl(path)
    const fileUrl = pub?.publicUrl
    if (!fileUrl) return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 })

    const recordedAt = new Date().toISOString()
    const insert = {
      baby_id: babyId,
      recorded_by: user.id,
      file_url: fileUrl,
      duration_seconds: duration || null,
      recorded_at: recordedAt,
      source: 'live',
      created_at: new Date().toISOString(),
    } as any
    const { error: dbErr } = await supabase.from('recordings').insert(insert)
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

    return NextResponse.json({ ok: true, file_url: fileUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) return NextResponse.json({ items: [] })

    const { data, error } = await supabase
      .from('recordings')
      .select(`
        id,
        file_url,
        duration_seconds,
        recorded_at,
        baby_id,
        babies:babies!recordings_baby_id_fkey ( name, avatar_url, gender )
      `)
      .eq('recorded_by', user.id)
      .order('recorded_at', { ascending: false })
      .limit(20)
    if (error) return NextResponse.json({ items: [], error: error.message }, { status: 500 })

    const items = (data || []).map((r: any) => ({
      id: r.id,
      fileUrl: r.file_url,
      durationSeconds: r.duration_seconds,
      recordedAt: r.recorded_at,
      babyId: r.baby_id,
      babyName: r.babies?.name || 'Unknown',
      babyAvatar: r.babies?.avatar_url || null,
      babyGender: r.babies?.gender || null,
    }))
    return NextResponse.json({ items })
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


