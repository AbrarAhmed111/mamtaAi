import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Proxy endpoint that forwards audio to FastAPI backend for processing
 * and saves cleaned audio to database.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const babyId = String(formData.get('baby_id') || '');
    const processedAudioBase64 = String(formData.get('processed_audio_base64') || '');

    if (!file || !babyId) {
      return NextResponse.json({ error: 'Missing audio file or baby_id' }, { status: 400 });
    }

    // If processed audio is provided (from FastAPI), save it instead of original
    let audioToSave = file;
    if (processedAudioBase64) {
      // Convert base64 back to File
      const audioBytes = Buffer.from(processedAudioBase64, 'base64');
      audioToSave = new File([audioBytes], `cleaned_${file.name}`, { type: 'audio/wav' });
    }

    // Save to Supabase storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const svc = createClient(supabaseUrl, serviceKey);
    const ext = audioToSave.name?.split('.').pop() || 'wav';
    const path = `recordings/${user.id}/${babyId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const audioBuffer = await audioToSave.arrayBuffer();
    const { error: uploadErr, data: uploadData } = await svc.storage
      .from('recordings')
      .upload(path, audioBuffer, { 
        upsert: true, 
        contentType: audioToSave.type || `audio/${ext}` 
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 400 });
    }

    const { data: pub } = svc.storage.from('recordings').getPublicUrl(path);
    const fileUrl = pub?.publicUrl;
    if (!fileUrl) {
      return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 });
    }

    // Save to database
    const recordedAt = new Date().toISOString();
    const insert = {
      baby_id: babyId,
      recorded_by: user.id,
      file_url: fileUrl,
      duration_seconds: Number(formData.get('duration_seconds')) || null,
      recorded_at: recordedAt,
      source: 'live',
      created_at: new Date().toISOString(),
    } as any;

    const { data: dbData, error: dbErr } = await supabase.from('recordings').insert(insert).select('id').single();
    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 400 });
    }

    // Verify the recording was actually saved
    if (!dbData || !dbData.id) {
      return NextResponse.json({ error: 'Failed to save recording to database' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      file_url: fileUrl,
      recording_id: dbData.id,
      storage_path: path,
      verified: true
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
