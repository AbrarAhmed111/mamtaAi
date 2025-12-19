import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    // Increment download count
    const { data: currentResource } = await supabase
      .from('shared_resources')
      .select('download_count')
      .eq('id', id)
      .single()
    
    if (currentResource) {
      await supabase
        .from('shared_resources')
        .update({ download_count: (currentResource.download_count || 0) + 1 })
        .eq('id', id)
    }

    const { data, error } = await supabase
      .from('shared_resources')
      .select('file_url, file_name')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      download_url: data.file_url,
      file_name: data.file_name 
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

