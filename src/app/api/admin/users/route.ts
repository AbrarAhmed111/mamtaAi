import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi, getAdminDb } from '@/lib/admin'
import { formatAccountType } from '@/lib/expert/profile-role'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { searchParams } = request.nextUrl
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const role = searchParams.get('role') || ''
  const status = searchParams.get('status') || ''
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)))
  const offset = (page - 1) * limit

  const db = getAdminDb()
  let query = (db as any)
    .from('profiles')
    .select('id, full_name, role, is_expert, is_verified, avatar_url, created_at, last_active_at, metadata', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (role === 'parent') {
    query = query.eq('role', 'parent').eq('is_expert', false)
  } else if (role === 'parent_expert') {
    query = query.eq('role', 'parent').eq('is_expert', true)
  } else if (role === 'admin') {
    query = query.eq('role', 'admin')
  }

  if (status === 'suspended') {
    query = query.contains('metadata', { suspended: true })
  } else if (status === 'active') {
    query = query.not('metadata', 'cs', '{"suspended":true}')
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let users = (data || []).map((row: Record<string, unknown>) => {
    const meta = (row.metadata as Record<string, unknown>) || {}
    const dbRole = String(row.role ?? 'parent')
    const isExpert = row.is_expert === true
    return {
      id: row.id,
      fullName: row.full_name,
      role: dbRole,
      isExpert,
      accountType: formatAccountType(dbRole, isExpert),
      isVerified: row.is_verified,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at,
      suspended: Boolean(meta.suspended),
      suspensionReason: meta.suspension_reason ?? null,
    }
  })

  if (q) {
    users = users.filter((u: { fullName: string; id: string }) =>
      u.fullName?.toLowerCase().includes(q) || String(u.id).includes(q),
    )
  }

  return NextResponse.json({
    users,
    pagination: { page, limit, total: count ?? users.length },
  })
}
