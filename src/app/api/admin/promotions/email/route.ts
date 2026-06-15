import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminApi, getAdminDb, writeAuditLog } from '@/lib/admin'
import { sendEmail } from '@/lib/email/send-email'
import { createPromotionalEmailTemplate } from '@/lib/email/templates'
import { getSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

type Audience = 'all' | 'free' | 'plus' | 'pro' | 'custom'

type Recipient = {
  id: string
  email: string
  fullName: string
}

function parseEmails(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String).map(e => e.trim().toLowerCase()).filter(Boolean)
  }
  return String(raw || '')
    .split(/[,\n]/)
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

function normalizeCtaUrl(raw: unknown): string {
  const fallback = `${getSiteUrl()}/pricing`
  const value = String(raw || fallback).trim()
  if (!value) return fallback
  if (/^https?:\/\//i.test(value)) return value
  return `${getSiteUrl()}${value.startsWith('/') ? value : `/${value}`}`
}

async function listAuthUsersByEmail(): Promise<Map<string, { id: string; email: string }>> {
  const db = getAdminDb()
  const users = new Map<string, { id: string; email: string }>()
  let page = 1

  while (page < 20) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const user of data.users) {
      if (user.email) users.set(user.email.toLowerCase(), { id: user.id, email: user.email })
    }
    if (data.users.length < 1000) break
    page += 1
  }

  return users
}

async function loadRecipients(audience: Audience, customEmails: string[]): Promise<Recipient[]> {
  const db = getAdminDb()
  const authUsers = await listAuthUsersByEmail()

  if (audience === 'custom') {
    return [...new Set(customEmails)].map(email => ({
      id: authUsers.get(email)?.id ?? email,
      email,
      fullName: 'there',
    }))
  }

  const { data: profiles, error } = await (db as any)
    .from('profiles')
    .select('id, full_name, metadata')
    .order('created_at', { ascending: false })

  if (error) throw error

  let allowedUserIds: Set<string> | null = null
  if (audience !== 'all') {
    const { data: subs, error: subsError } = await (db as any)
      .from('user_subscriptions')
      .select('user_id, plan:subscription_plans!user_subscriptions_plan_id_fkey(slug)')
      .eq('status', 'active')

    if (subsError) throw subsError
    allowedUserIds = new Set(
      (subs || [])
        .filter((row: any) => row?.plan?.slug === audience)
        .map((row: any) => String(row.user_id)),
    )
  }

  const emailByUserId = new Map([...authUsers.values()].map(u => [u.id, u.email]))
  return (profiles || [])
    .filter((profile: any) => !allowedUserIds || allowedUserIds.has(String(profile.id)))
    .filter((profile: any) => {
      const prefs = (profile.metadata as any)?.notificationPreferences
      return prefs?.promotional !== false && prefs?.emailProductUpdates !== false
    })
    .map((profile: any) => ({
      id: String(profile.id),
      email: emailByUserId.get(String(profile.id)),
      fullName: String(profile.full_name || 'there'),
    }))
    .filter((recipient: Recipient) => Boolean(recipient.email))
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json().catch(() => ({}))
    const audience = String(body.audience || 'all').toLowerCase() as Audience
    const subject = String(body.subject || '').trim()
    const heading = String(body.heading || subject).trim()
    const message = String(body.message || '').trim()
    const ctaLabel = String(body.ctaLabel || 'Open MamtaAI').trim()
    const ctaUrl = normalizeCtaUrl(body.ctaUrl)
    const offerCode = body.offerCode ? String(body.offerCode).trim().toUpperCase() : ''
    const customEmails = parseEmails(body.customEmails)

    if (!['all', 'free', 'plus', 'pro', 'custom'].includes(audience)) {
      return NextResponse.json({ error: 'Invalid audience' }, { status: 400 })
    }
    if (!subject || !heading || !message) {
      return NextResponse.json({ error: 'Subject, heading, and message are required' }, { status: 400 })
    }
    if (audience === 'custom' && customEmails.length === 0) {
      return NextResponse.json({ error: 'Add at least one custom recipient email' }, { status: 400 })
    }

    const recipients = await loadRecipients(audience, customEmails)
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients matched this audience' }, { status: 400 })
    }

    const logoUrl = `${getSiteUrl()}/mamta-email-logo.png`
    const results = []

    for (const recipient of recipients) {
      const html = createPromotionalEmailTemplate({
        recipientName: recipient.fullName,
        heading,
        message,
        ctaLabel,
        ctaUrl,
        offerCode,
        logoUrl,
      })
      const sent = await sendEmail({ to: recipient.email, subject, html })
      results.push({ ...recipient, ok: sent.ok, error: sent.error })
    }

    const sentCount = results.filter(r => r.ok).length
    const failedCount = results.length - sentCount

    const db = getAdminDb()
    await (db as any).from('promotional_email_campaigns').insert({
      admin_id: auth.admin.id,
      audience,
      subject,
      heading,
      message,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      offer_code: offerCode || null,
      recipient_count: results.length,
      sent_count: sentCount,
      failed_count: failedCount,
      metadata: { failures: results.filter(r => !r.ok).slice(0, 25) },
    }).then(() => null, () => null)

    await writeAuditLog({
      adminId: auth.admin.id,
      action: 'promotional_email_send',
      entityType: 'promotional_email_campaign',
      newValues: {
        audience,
        subject,
        recipientCount: results.length,
        sentCount,
        failedCount,
      },
    })

    return NextResponse.json({
      ok: failedCount === 0,
      recipientCount: results.length,
      sentCount,
      failedCount,
      failures: results.filter(r => !r.ok).slice(0, 10),
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to send promotional email' },
      { status: 500 },
    )
  }
}
