import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi, getAdminDb, writeAuditLog } from '@/lib/admin'

export const dynamic = 'force-dynamic'

type RouteCtx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const db = getAdminDb()

  const { data: existing, error: fetchError } = await (db as any)
    .from('discount_coupons')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  const fields = [
    ['description', 'description'],
    ['discountType', 'discount_type'],
    ['discountValue', 'discount_value'],
    ['maxDiscountAmount', 'max_discount_amount'],
    ['validFrom', 'valid_from'],
    ['validUntil', 'valid_until'],
    ['maxUses', 'max_uses'],
    ['maxUsesPerUser', 'max_uses_per_user'],
    ['isActive', 'is_active'],
  ] as const

  for (const [bodyKey, col] of fields) {
    if (body[bodyKey] !== undefined) updates[col] = body[bodyKey]
    if (body[col] !== undefined) updates[col] = body[col]
  }

  if (body.code !== undefined) updates.code = String(body.code).trim().toUpperCase()

  const { data: updated, error: updateError } = await (db as any)
    .from('discount_coupons')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await writeAuditLog({
    adminId: auth.admin.id,
    action: 'coupon_update',
    entityType: 'discount_coupon',
    entityId: id,
    oldValues: existing,
    newValues: updated,
  })

  return NextResponse.json({ coupon: updated })
}

export async function DELETE(_request: NextRequest, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  const db = getAdminDb()

  const { data: existing } = await (db as any).from('discount_coupons').select('*').eq('id', id).maybeSingle()

  const { error } = await (db as any).from('discount_coupons').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await writeAuditLog({
    adminId: auth.admin.id,
    action: 'coupon_delete',
    entityType: 'discount_coupon',
    entityId: id,
    oldValues: existing ?? null,
  })

  return NextResponse.json({ ok: true })
}
