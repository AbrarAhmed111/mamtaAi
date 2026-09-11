'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/components/ui/sonner'
import Spinner from '@/components/ui/spinner'
import Select from '@/components/ui/select'
import { AdminBadge, AdminEmptyState, AdminPageHeader, AdminTableShell, ADMIN_BTN_PRIMARY } from './AdminUi'

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed amount' },
]

type Coupon = {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  valid_from: string
  valid_until: string
  is_active: boolean
  current_uses: number
  max_uses: number | null
  applicable_plans: string[] | null
  stripe_coupon_id?: string | null
  stripe_promotion_code_id?: string | null
}

const PLAN_OPTIONS = [
  { value: 'plus', label: 'Plus' },
  { value: 'pro', label: 'Pro' },
]

function defaultValidUntil() {
  const d = new Date()
  d.setDate(d.getDate() + 90)
  return d.toISOString().slice(0, 10)
}

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '10',
    validUntil: defaultValidUntil(),
    maxUses: '',
    applicablePlans: ['plus', 'pro'],
    firstTimeUsersOnly: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to load coupons')
      setCoupons(data.coupons || [])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createCoupon = async () => {
    if (creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description || null,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          validUntil: new Date(`${form.validUntil}T23:59:59.000Z`).toISOString(),
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          applicablePlans: form.applicablePlans,
          firstTimeUsersOnly: form.firstTimeUsersOnly,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Create failed')
      toast.success('Coupon created')
      setShowForm(false)
      setForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '10',
        validUntil: defaultValidUntil(),
        maxUses: '',
        applicablePlans: ['plus', 'pro'],
        firstTimeUsersOnly: false,
      })
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  const togglePlan = (plan: string) => {
    setForm(f => {
      const set = new Set(f.applicablePlans)
      if (set.has(plan)) set.delete(plan)
      else set.add(plan)
      return { ...f, applicablePlans: Array.from(set) }
    })
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Update failed')
      }
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Create Stripe-connected discount codes for paid plan checkout."
        action={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className={ADMIN_BTN_PRIMARY}
          >
            New coupon
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <AdminTableShell>
          {coupons.length === 0 ? (
            <AdminEmptyState message="No coupons yet." />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-pink-100 bg-pink-50/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Valid</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Stripe</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {coupons.map(c => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                    <td className="px-4 py-3">
                      {c.discount_type === 'percentage'
                        ? `${c.discount_value}%`
                        : `$${c.discount_value}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(c.valid_from).toLocaleDateString()} –{' '}
                      {new Date(c.valid_until).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {c.current_uses ?? 0}
                      {c.max_uses != null ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge tone={c.stripe_promotion_code_id ? 'green' : 'amber'}>
                        {c.stripe_promotion_code_id ? 'Synced' : 'Local'}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge tone={c.is_active ? 'green' : 'gray'}>
                        {c.is_active ? 'Active' : 'Disabled'}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(c.id, c.is_active)}
                        className="text-pink-600 hover:underline text-xs"
                      >
                        {c.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableShell>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              New coupon
            </h3>
            <div className="mt-4 space-y-3">
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                placeholder="CODE"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase"
              />
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={form.discountType}
                  onChange={discountType => setForm(f => ({ ...f, discountType }))}
                  options={DISCOUNT_TYPE_OPTIONS}
                  aria-label="Discount type"
                />
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <input
                type="date"
                value={form.validUntil}
                onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Max redemptions (optional)"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <div className="rounded-xl border border-pink-100 bg-pink-50/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">
                  Applicable plans
                </p>
                <div className="mt-2 flex gap-2">
                  {PLAN_OPTIONS.map(plan => (
                    <button
                      key={plan.value}
                      type="button"
                      onClick={() => togglePlan(plan.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        form.applicablePlans.includes(plan.value)
                          ? 'border-pink-300 bg-white text-pink-700'
                          : 'border-gray-200 bg-white/60 text-gray-500'
                      }`}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.firstTimeUsersOnly}
                  onChange={e => setForm(f => ({ ...f, firstTimeUsersOnly: e.target.checked }))}
                  className="h-4 w-4 accent-pink-600"
                />
                First-time paid subscribers only
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={creating}
                className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createCoupon()}
                disabled={creating}
                className="rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-2 text-sm font-semibold text-white hover:from-pink-600 hover:to-rose-600 disabled:cursor-wait disabled:opacity-75"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
