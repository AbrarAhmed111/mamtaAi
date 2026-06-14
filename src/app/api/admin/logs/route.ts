import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi, getAdminDb } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { searchParams } = request.nextUrl
  const type = searchParams.get('type') || 'all'
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)))

  const db = getAdminDb()
  const results: { audit: unknown[]; errors: unknown[] } = { audit: [], errors: [] }

  if (type === 'all' || type === 'audit') {
    const { data } = await (db as any)
      .from('audit_logs')
      .select(
        `
        id,
        action,
        entity_type,
        entity_id,
        status,
        created_at,
        old_values,
        new_values,
        actor:profiles!audit_logs_user_id_fkey(full_name)
      `,
      )
      .order('created_at', { ascending: false })
      .limit(limit)
    results.audit = data ?? []
  }

  if (type === 'all' || type === 'errors') {
    const { data } = await (db as any)
      .from('error_logs')
      .select('id, error_type, error_message, severity, endpoint, is_resolved, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    results.errors = data ?? []
  }

  return NextResponse.json(results)
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const errorId = body.errorId as string | undefined
  if (!errorId) {
    return NextResponse.json({ error: 'errorId required' }, { status: 400 })
  }

  const db = getAdminDb()
  const { error } = await (db as any)
    .from('error_logs')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolution_notes: body.notes || 'Resolved by admin',
    })
    .eq('id', errorId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
