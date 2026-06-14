import { createBaseEmailTemplate } from '@/lib/email/templates/base-template'
import { getInviteEmailLogoMailParts } from '@/lib/email/invite-email-logo'
import { sendEmail } from '@/lib/email/send-email'
import type { OximeterBreachKind } from '@/lib/oximeter/baby-thresholds'
import { supabaseAdmin } from '@/lib/supabase/client'

function getSiteBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NODE_ENV === 'production') return 'https://mamtaai.vercel.app'
  return 'http://localhost:3000'
}

export type DispatchOximeterAlertInput = {
  userId: string
  babyId: string
  babyName: string
  spo2: number
  pulse: number
  breaches: OximeterBreachKind[]
  title: string
  body: string
  sendEmail?: boolean
}

export async function dispatchOximeterAlert(input: DispatchOximeterAlertInput): Promise<void> {
  const actionUrl = '/dashboard/oximeter'

  await (supabaseAdmin as any).from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    body: input.body,
    notification_type: 'oximeter_alert',
    category: 'oximeter',
    priority: 'urgent',
    action_type: 'link',
    action_url: actionUrl,
    action_data: {
      kind: 'oximeter_threshold',
      babyId: input.babyId,
      babyName: input.babyName,
      spo2: input.spo2,
      pulse: input.pulse,
      breaches: input.breaches,
    },
    related_baby_id: input.babyId,
    metadata: { source: 'oximeter_threshold_alert' },
    sent_at: new Date().toISOString(),
    email_sent: input.sendEmail === true,
  })

  if (input.sendEmail === false) return

  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(input.userId)
    const email = authUser.user?.email
    if (!email) return

    const { data: profile } = await (supabaseAdmin as any)
      .from('profiles')
      .select('full_name')
      .eq('id', input.userId)
      .maybeSingle()

    const siteBase = getSiteBaseUrl()
    const absoluteActionUrl = `${siteBase}${actionUrl}`
    const { logoUrl, attachments } = getInviteEmailLogoMailParts(siteBase)

    const html = createBaseEmailTemplate({
      brandTheme: true,
      preheader: input.title,
      heading: input.title,
      subheading: `${input.babyName} · SpO₂ ${input.spo2}% · ${input.pulse} BPM`,
      bodyHtml: `<p style="margin:0 0 16px;line-height:1.6;">${input.body}</p>
        <p style="margin:0;"><a href="${absoluteActionUrl}" style="color:#db2777;font-weight:600;">Open oximeter monitoring</a></p>`,
      footerNote:
        'You receive this because oximeter alerts are enabled for your MamtaAI account. Adjust limits on the baby profile or notification settings.',
      logoUrl: logoUrl || undefined,
    })

    await sendEmail({
      to: email,
      subject: `[MamtaAI] ${input.title}`,
      html,
      attachments,
    })
  } catch (e) {
    console.warn('[oximeter-notifications] email failed', e)
  }
}
