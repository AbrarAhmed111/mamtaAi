import { createAdminAlertEmailTemplate } from '@/lib/email/templates/admin-alert-email-template'
import { getInviteEmailLogoMailParts } from '@/lib/email/invite-email-logo'
import { sendEmail } from '@/lib/email/send-email'
import { supabaseAdmin } from '@/lib/supabase/client'

function getSiteBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NODE_ENV === 'production') return 'https://mamtaai.vercel.app'
  return 'http://localhost:3000'
}

async function sendUserEmail(
  userId: string,
  subject: string,
  heading: string,
  body: string,
  actionUrl: string,
): Promise<void> {
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = authUser.user?.email
    if (!email) return

    const { data: profile } = await (supabaseAdmin as any)
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle()

    const siteBase = getSiteBaseUrl()
    const absoluteActionUrl = `${siteBase}${actionUrl.startsWith('/') ? actionUrl : `/${actionUrl}`}`
    const { logoUrl, attachments } = getInviteEmailLogoMailParts(siteBase)
    const html = createAdminAlertEmailTemplate({
      adminName: profile?.full_name || 'there',
      heading,
      body,
      actionUrl: absoluteActionUrl,
      logoUrl: logoUrl || undefined,
    })

    await sendEmail({
      to: email,
      subject,
      html,
      attachments,
    })
  } catch (e) {
    console.warn('[expert-application-notifications] email failed', e)
  }
}

export async function notifyUserExpertApplicationApproved(userId: string): Promise<void> {
  const title = 'Expert application approved'
  const body =
    'Congratulations! Your expert application has been approved. You can now switch to Expert view on your dashboard and edit your public profile.'

  await (supabaseAdmin as any).from('notifications').insert({
    user_id: userId,
    title,
    body,
    notification_type: 'system',
    category: 'community',
    priority: 'high',
    action_type: 'link',
    action_url: '/dashboard',
    action_data: { kind: 'expert_approved' },
    metadata: { source: 'expert_application', event: 'approved' },
    sent_at: new Date().toISOString(),
  })

  void sendUserEmail(userId, `[MamtaAI] ${title}`, title, body, '/dashboard')
}

export async function notifyUserExpertApplicationRejected(
  userId: string,
  reason?: string | null,
  reapplyAt?: string | null,
): Promise<void> {
  const title = 'Expert application not approved'
  const reasonPart = reason ? ` Reason: ${reason}.` : ''
  const reapplyPart = reapplyAt
    ? ` You may re-apply after ${new Date(reapplyAt).toLocaleString()}.`
    : ''
  const body = `Your expert application was not approved at this time.${reasonPart}${reapplyPart} Contact support if you have questions.`

  await (supabaseAdmin as any).from('notifications').insert({
    user_id: userId,
    title,
    body,
    notification_type: 'system',
    category: 'community',
    priority: 'normal',
    action_type: 'link',
    action_url: '/dashboard/settings?tab=professional',
    action_data: { kind: 'expert_rejected', reapplyAt: reapplyAt ?? null },
    metadata: { source: 'expert_application', event: 'rejected' },
    sent_at: new Date().toISOString(),
  })

  void sendUserEmail(
    userId,
    `[MamtaAI] ${title}`,
    title,
    body,
    '/dashboard/settings?tab=professional',
  )
}
