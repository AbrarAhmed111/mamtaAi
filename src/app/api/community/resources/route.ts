import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resource_type')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('shared_resources' as any)
      .select(`
        id,
        title,
        description,
        file_url,
        file_name,
        file_size_bytes,
        file_type,
        mime_type,
        resource_type,
        category,
        subcategory,
        age_group,
        tags,
        download_count,
        view_count,
        like_count,
        rating_average,
        rating_count,
        is_verified,
        created_at,
        uploader:profiles!shared_resources_uploader_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('is_active', true)
      .eq('is_public', true)
      .order('is_verified', { ascending: false })
      .order('download_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ resources: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      file_url,
      file_name,
      file_size_bytes,
      file_type,
      mime_type,
      resource_type,
      category,
      subcategory,
      age_group,
      tags = [],
    } = body

    if (!title || !file_url || !file_name || !resource_type || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('shared_resources' as any)
      .insert({
        uploader_id: user.id,
        title,
        description,
        file_url,
        file_name,
        file_size_bytes,
        file_type,
        mime_type,
        resource_type,
        category,
        subcategory,
        age_group: age_group || 'all',
        tags,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ resource: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

