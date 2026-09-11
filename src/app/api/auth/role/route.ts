import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const role = (body?.role || '').toString()
    if (!['parent', 'expert'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', user.id)
      .maybeSingle()

    const baseMeta =
      existing?.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {}

    if (role === 'expert') {
      baseMeta.expert_application_intent = true
    } else {
      delete baseMeta.expert_application_intent
    }

    // Expert applicants stay on parent dashboard until admin approval (Expert Flow plan).
    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'parent',
        is_expert: false,
        is_verified: true,
        metadata: baseMeta as never,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, nextPath: role === 'expert' ? '/auth/expert-application' : '/dashboard' })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
