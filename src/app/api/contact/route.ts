import { NextResponse, type NextRequest } from 'next/server'
import { sendEmail } from '@/lib/email/send-email'
import { createBaseEmailTemplate } from '@/lib/email/templates/base-template'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '').trim()
    const subject = String(body?.subject ?? '').trim()
    const message = String(body?.message ?? '').trim()

    // Validation
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 })
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message must be 5,000 characters or less.' }, { status: 400 })
    }

    const to =
      process.env.CONTACT_TO_EMAIL?.trim() ||
      process.env.SMTP_FROM_EMAIL?.trim() ||
      'support@mamtaai.com'

    const html = createBaseEmailTemplate({
      preheader: `New contact message from ${name}`,
      heading: 'New Contact Message',
      subheading: subject || 'Website contact form',
      bodyHtml: `
        <div style="font-size:15px;line-height:24px;color:#314067;">
          <strong>From:</strong> ${escapeHtml(name)}<br />
          <strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color:#4162ff;text-decoration:none;">${escapeHtml(email)}</a>
          ${subject ? `<br /><strong>Subject:</strong> ${escapeHtml(subject)}` : ''}
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #edf1ff;font-size:15px;line-height:24px;color:#314067;white-space:pre-wrap;">${escapeHtml(message)}</div>
      `,
      footerNote: 'Reply directly to this email to respond to the sender.',
    })

    const result = await sendEmail({
      to,
      subject: subject ? `Contact: ${subject}` : `New contact message from ${name}`,
      html,
      replyTo: email,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Could not send your message. Please try again later.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
