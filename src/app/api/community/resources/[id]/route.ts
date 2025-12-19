import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    // Increment view count
    const { data: currentResource } = await supabase
      .from('shared_resources' as any)
      .select('*')
      .eq('id', id)
      .single()
    
    if (currentResource) {
      const currentCount = (currentResource && 'view_count' in currentResource ? (currentResource as any).view_count : 0) || 0
      await supabase
        .from('shared_resources' as any)
        .update({ view_count: currentCount + 1 } as any)
        .eq('id', id)
    }

    const { data, error } = await supabase
      .from('shared_resources' as any)
      .select(`
        *,
        uploader:profiles!shared_resources_uploader_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    return NextResponse.json({ resource: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if user is the uploader
    const { data: resource } = await supabase
      .from('shared_resources' as any)
      .select('*')
      .eq('id', id)
      .single()

    const resourceData = resource as any
    if (!resourceData || resourceData.uploader_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('shared_resources' as any)
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ resource: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is the uploader
    const { data: resource } = await supabase
      .from('shared_resources' as any)
      .select('*')
      .eq('id', id)
      .single()

    const resourceData = resource as any
    if (!resourceData || resourceData.uploader_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('shared_resources' as any)
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

