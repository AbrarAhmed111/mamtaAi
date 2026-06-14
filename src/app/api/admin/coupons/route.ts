import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi, getAdminDb, writeAuditLog } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const db = getAdminDb()
  const { data, error } = await (db as any)
    .from('discount_coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupons: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const code = String(body.code || '').trim().toUpperCase()
  const discountType = body.discountType || body.discount_type
  const discountValue = Number(body.discountValue ?? body.discount_value)

  if (!code || !['percentage', 'fixed_amount'].includes(discountType)) {
    return NextResponse.json({ error: 'Invalid coupon payload' }, { status: 400 })
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return NextResponse.json({ error: 'Invalid discount value' }, { status: 400 })
  }

  const validFrom = body.validFrom || body.valid_from || new Date().toISOString()
  const validUntil =
    body.validUntil ||
    body.valid_until ||
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const row = {
    code,
    description: body.description || null,
    discount_type: discountType,
    discount_value: discountValue,
    max_discount_amount: body.maxDiscountAmount ?? body.max_discount_amount ?? null,
    valid_from: validFrom,
    valid_until: validUntil,
    max_uses: body.maxUses ?? body.max_uses ?? null,
    max_uses_per_user: body.maxUsesPerUser ?? body.max_uses_per_user ?? 1,
    applicable_plans: body.applicablePlans ?? body.applicable_plans ?? [],
    minimum_purchase_amount: body.minimumPurchaseAmount ?? body.minimum_purchase_amount ?? null,
    first_time_users_only: Boolean(body.firstTimeUsersOnly ?? body.first_time_users_only),
    is_active: body.isActive !== false,
  }

  const db = getAdminDb()
  const { data, error } = await (db as any).from('discount_coupons').insert(row).select('*').single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await writeAuditLog({
    adminId: auth.admin.id,
    action: 'coupon_create',
    entityType: 'discount_coupon',
    entityId: data.id,
    newValues: data,
  })

  return NextResponse.json({ coupon: data }, { status: 201 })
}
