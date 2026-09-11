import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/*
  Supabase table required (run in SQL editor):

  create table cry_feedback (
    id uuid primary key default gen_random_uuid(),
    recording_id uuid not null references recordings(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    predicted_cry_type text not null,
    corrected_cry_type text not null,
    created_at timestamptz not null default now()
  );
  alter table cry_feedback enable row level security;
  create policy "Users manage own feedback"
    on cry_feedback for all
    using (auth.uid() = user_id);
*/

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: recordingId } = await params
    const { predicted_cry_type, corrected_cry_type } = await request.json()

    if (!corrected_cry_type) {
      return NextResponse.json({ error: 'corrected_cry_type is required' }, { status: 400 })
    }

    // Verify the recording belongs to this user
    const { data: recording, error: recErr } = await supabase
      .from('recordings')
      .select('id, recorded_by')
      .eq('id', recordingId)
      .single()

    if (recErr || !recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }
    if (recording.recorded_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upsert — one feedback row per recording (replace if they change their mind)
    const { error } = await supabase
      .from('cry_feedback')
      .upsert(
        {
          recording_id: recordingId,
          user_id: user.id,
          predicted_cry_type: predicted_cry_type ?? '',
          corrected_cry_type,
        },
        { onConflict: 'recording_id' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
