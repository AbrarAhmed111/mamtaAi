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
      .from('shared_resources')
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

    // Strict validation
    const validResourceTypes = ['guide', 'checklist', 'schedule', 'template', 'ebook', 'infographic', 'worksheet', 'other']
    const validAgeGroups = ['all', 'newborn', '0-3months', '3-6months', '6-12months', '1-2years']

    // Title validation
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 5) {
      return NextResponse.json({ error: 'Title must be at least 5 characters' }, { status: 400 })
    }
    if (trimmedTitle.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 })
    }

    // File validation
    if (!file_url || typeof file_url !== 'string') {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 })
    }
    if (!file_name || typeof file_name !== 'string') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 })
    }

    // Resource type validation
    if (!resource_type || typeof resource_type !== 'string' || !validResourceTypes.includes(resource_type)) {
      return NextResponse.json({ error: 'Please select a valid resource type' }, { status: 400 })
    }

    // Category validation
    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Description validation
    if (description && typeof description === 'string' && description.length > 2000) {
      return NextResponse.json({ error: 'Description must be 2000 characters or less' }, { status: 400 })
    }

    // Subcategory validation
    if (subcategory && typeof subcategory === 'string' && subcategory.length > 100) {
      return NextResponse.json({ error: 'Subcategory must be 100 characters or less' }, { status: 400 })
    }

    // Age group validation
    if (age_group && !validAgeGroups.includes(age_group)) {
      return NextResponse.json({ error: 'Invalid age group' }, { status: 400 })
    }

    // Tags validation
    if (tags && Array.isArray(tags)) {
      if (tags.length > 10) {
        return NextResponse.json({ error: 'Maximum 10 tags allowed' }, { status: 400 })
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 30) {
          return NextResponse.json({ error: 'Each tag must be 30 characters or less' }, { status: 400 })
        }
      }
    }

    const { data, error } = await supabase
      .from('shared_resources')
      .insert({
        uploader_id: user.id,
        title: trimmedTitle,
        description: description?.trim() || null,
        file_url,
        file_name,
        file_size_bytes: file_size_bytes || null,
        file_type: file_type || null,
        mime_type: mime_type || null,
        resource_type,
        category,
        subcategory: subcategory?.trim() || null,
        age_group: age_group || 'all',
        tags: tags || [],
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

