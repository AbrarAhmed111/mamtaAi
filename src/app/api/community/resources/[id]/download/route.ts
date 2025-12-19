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
      .from('shared_resources' as any)
      .select('*')
      .eq('id', id)
      .single()

    if (currentResource) {
      const currentCount = (currentResource && 'download_count' in currentResource ? (currentResource as any).download_count : 0) || 0
      await supabase
        .from('shared_resources' as any)
        .update({ download_count: currentCount + 1 } as any)
        .eq('id', id)
    }

    const { data, error } = await supabase
      .from('shared_resources' as any)
      .select('file_url, file_name')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    const resourceData = data as any
    return NextResponse.json({ 
      download_url: resourceData.file_url,
      file_name: resourceData.file_name 
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

