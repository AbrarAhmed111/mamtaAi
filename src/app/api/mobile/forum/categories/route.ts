import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { data, error } = await (supabaseAdmin as any)
    .from('forum_categories')
    .select('id, name, slug, description, icon, color_hex, thread_count, post_count')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categories: data || [] })
}

