'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/sonner'
import Select from '@/components/ui/select'
import { AdminPageHeader, ADMIN_BTN_PRIMARY } from './AdminUi'

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All opted-in users' },
  { value: 'free', label: 'Free users' },
  { value: 'plus', label: 'Plus users' },
  { value: 'pro', label: 'Pro users' },
  { value: 'custom', label: 'Custom email list' },
]

export default function PromotionalEmailManager() {
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    audience: 'free',
    customEmails: '',
    subject: 'A special MamtaAI offer for your family',
    heading: 'Unlock more support with MamtaAI',
    message:
      'For a limited time, you can upgrade your MamtaAI plan and get more cry analyses, deeper insights, and family caregiver access.\n\nUse the offer below at checkout and keep building a calmer care routine for your baby.',
    ctaLabel: 'View plans',
    ctaUrl: '/pricing',
    offerCode: '',
  })

  const sendCampaign = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/admin/promotions/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to send campaign')
      toast.success(`Sent ${data.sentCount}/${data.recipientCount} emails`)
      if (data.failedCount > 0) {
        toast.error(`${data.failedCount} emails failed. Check SMTP settings or recipient addresses.`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Promotional emails"
        description="Send branded announcements, advertisements, coupon campaigns, and product updates."
        action={
          <button
            type="button"
            disabled={sending}
            onClick={() => void sendCampaign()}
            className={ADMIN_BTN_PRIMARY}
          >
            {sending ? 'Sending...' : 'Send campaign'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm shadow-pink-100/20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Audience
              </span>
              <Select
                value={form.audience}
                onChange={audience => setForm(f => ({ ...f, audience }))}
                options={AUDIENCE_OPTIONS}
                aria-label="Audience"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Offer code
              </span>
              <input
                value={form.offerCode}
                onChange={e => setForm(f => ({ ...f, offerCode: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase"
              />
            </label>
          </div>

          {form.audience === 'custom' && (
            <label className="mt-4 block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Custom emails
              </span>
              <textarea
                value={form.customEmails}
                onChange={e => setForm(f => ({ ...f, customEmails: e.target.value }))}
                placeholder="one@example.com, two@example.com"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
          )}

          <label className="mt-4 block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Subject
            </span>
            <input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Heading
            </span>
            <input
              value={form.heading}
              onChange={e => setForm(f => ({ ...f, heading: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Message
            </span>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={8}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm leading-relaxed"
            />
          </label>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Button label
              </span>
              <input
                value={form.ctaLabel}
                onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Button URL
              </span>
              <input
                value={form.ctaUrl}
                onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        <aside className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-5 shadow-sm shadow-pink-100/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Preview</p>
          <h2 className="mt-3 text-xl font-bold text-gray-900">{form.heading || 'Email heading'}</h2>
          <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {form.message || 'Email body preview'}
          </div>
          {form.offerCode && (
            <div className="mt-4 rounded-xl border border-pink-200 bg-white p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-pink-600">Promo code</p>
              <p className="mt-1 text-2xl font-black tracking-widest text-pink-700">
                {form.offerCode}
              </p>
            </div>
          )}
          <div className="mt-5 rounded-xl bg-pink-600 px-4 py-3 text-center text-sm font-bold text-white">
            {form.ctaLabel || 'Open MamtaAI'}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Sends only to users who have not disabled promotional/product email preferences.
          </p>
        </aside>
      </div>
    </div>
  )
}
