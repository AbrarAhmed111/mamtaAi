import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        featured_image_url,
        category,
        subcategory,
        tags,
        age_group,
        view_count,
        like_count,
        comment_count,
        is_expert_content,
        author_credentials,
        published_at,
        is_pinned,
        created_at,
        author:profiles!blog_posts_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: data || [] })
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
      content,
      excerpt,
      category,
      subcategory,
      tags = [],
      age_group,
      featured_image_url,
      is_expert_content = false,
      author_credentials,
    } = body

    // Strict validation
    const validCategories = ['Feeding', 'Sleep', 'Health', 'Development', 'Activities', 'Products', 'Tips', 'Stories', 'Other']
    const validAgeGroups = ['all', 'newborn', '0-3months', '3-6months', '6-12months', '1-2years']

    // Title validation
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 10) {
      return NextResponse.json({ error: 'Title must be at least 10 characters' }, { status: 400 })
    }
    if (trimmedTitle.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 })
    }
    if (/[<>{}[\]\\]/.test(trimmedTitle)) {
      return NextResponse.json({ error: 'Title contains invalid characters' }, { status: 400 })
    }

    // Content validation
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    const trimmedContent = content.trim()
    if (trimmedContent.length < 100) {
      return NextResponse.json({ error: 'Content must be at least 100 characters' }, { status: 400 })
    }
    if (trimmedContent.length > 50000) {
      return NextResponse.json({ error: 'Content must be 50,000 characters or less' }, { status: 400 })
    }

    // Category validation
    if (!category || typeof category !== 'string' || !validCategories.includes(category)) {
      return NextResponse.json({ error: 'Please select a valid category' }, { status: 400 })
    }

    // Excerpt validation
    if (excerpt && typeof excerpt === 'string' && excerpt.length > 500) {
      return NextResponse.json({ error: 'Excerpt must be 500 characters or less' }, { status: 400 })
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
        if (!/^[a-zA-Z0-9\s-]+$/.test(tag)) {
          return NextResponse.json({ error: 'Tags can only contain letters, numbers, spaces, and hyphens' }, { status: 400 })
        }
      }
    }

    // Image URL validation
    if (featured_image_url && typeof featured_image_url === 'string' && featured_image_url.trim()) {
      try {
        const urlObj = new URL(featured_image_url)
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          return NextResponse.json({ error: 'Image URL must use http or https protocol' }, { status: 400 })
        }
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        const pathname = urlObj.pathname.toLowerCase()
        if (!validExtensions.some(ext => pathname.endsWith(ext))) {
          return NextResponse.json({ error: 'Image URL must point to a valid image file' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'Invalid image URL format' }, { status: 400 })
      }
    }

    // Expert content validation
    if (is_expert_content && (!author_credentials || typeof author_credentials !== 'string' || !author_credentials.trim())) {
      return NextResponse.json({ error: 'Credentials are required for expert content' }, { status: 400 })
    }
    if (author_credentials && typeof author_credentials === 'string' && author_credentials.length > 200) {
      return NextResponse.json({ error: 'Credentials must be 200 characters or less' }, { status: 400 })
    }

    // Generate slug from trimmed title
    const slug = trimmedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100)

    // Check if slug exists, append number if needed
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    let finalSlug = slug
    if (existing) {
      finalSlug = `${slug}-${Date.now()}`
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        author_id: user.id,
        title: trimmedTitle,
        slug: finalSlug,
        content: trimmedContent,
        excerpt: excerpt?.trim() || trimmedContent.substring(0, 200),
        category,
        subcategory: subcategory?.trim() || null,
        tags: tags || [],
        age_group: age_group || 'all',
        featured_image_url: featured_image_url?.trim() || null,
        is_expert_content,
        author_credentials: author_credentials?.trim() || null,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}



