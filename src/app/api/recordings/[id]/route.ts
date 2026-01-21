import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recording to verify ownership and get file URL
    const { data: recording, error: fetchError } = await supabase
      .from('recordings')
      .select('id, file_url, recorded_by')
      .eq('id', id)
      .single()

    if (fetchError || !recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }

    // Verify ownership
    if (recording.recorded_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete file from storage if file_url exists
    if (recording.file_url) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseUrl && serviceKey) {
          const svc = createClient(supabaseUrl, serviceKey)
          
          // Extract path from URL
          const url = new URL(recording.file_url)
          const pathParts = url.pathname.split('/')
          const bucketIndex = pathParts.findIndex(part => part === 'recordings')
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/')
            await svc.storage.from('recordings').remove([filePath])
          }
        }
      } catch (storageError) {
        // Log but don't fail - database record will still be deleted
        console.error('Error deleting file from storage:', storageError)
      }
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from('recordings')
      .delete()
      .eq('id', id)
      .eq('recorded_by', user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Delete failed' }, { status: 500 })
  }
}

