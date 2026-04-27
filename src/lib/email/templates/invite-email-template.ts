import { createBaseEmailTemplate } from './base-template'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface InviteEmailTemplateData {
  /** When the invitee already has an account, their display name (from profile). Omit for unknown / new users. */
  inviteeDisplayName?: string | null
  babyName?: string
  inviteLink?: string
  /** Absolute URL to site-hosted logo */
  logoUrl?: string | null
}

export function createInviteEmailTemplate({
  inviteeDisplayName,
  babyName = '',
  inviteLink = '',
  logoUrl,
}: InviteEmailTemplateData = {}): string {
  const safeBaby = escapeHtml(babyName || 'your child')
  const safeLink = escapeHtml(inviteLink)
  const preBaby = escapeHtml(babyName || 'your child')

  const name = typeof inviteeDisplayName === 'string' ? inviteeDisplayName.trim() : ''
  const greeting =
    name.length > 0
      ? `<div style="font-size:15px;line-height:24px;color:#4b5563;">
        Hi ${escapeHtml(name)},
      </div>`
      : ''

  return createBaseEmailTemplate({
    brandTheme: true,
    logoUrl: logoUrl || undefined,
    preheader: `You are invited to ${preBaby}'s dashboard updates.`,
    heading: 'You Are Invited',
    subheading: `A family member invited you to follow updates for ${safeBaby}.`,
    bodyHtml: `
      ${greeting}
      <div style="margin-top:${name ? '12' : '0'}px;font-size:15px;line-height:24px;color:#4b5563;">
        You have been invited to view updates, milestones, and shared moments for <strong style="color:#9f1239;">${safeBaby}</strong>.
      </div>
      <div style="margin-top:20px;text-align:center;">
        <a href="${safeLink}" style="display:inline-block;background-color:#db2777;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:20px;padding:12px 28px;border-radius:12px;">
          Accept invitation
        </a>
      </div>
      <div style="margin-top:16px;font-size:13px;line-height:21px;color:#6b7280;">
        If the button does not work, use this link:
        <br />
        <a href="${safeLink}" style="color:#db2777;word-break:break-word;text-decoration:underline;">${safeLink}</a>
      </div>
      <div style="margin-top:16px;font-size:13px;line-height:21px;color:#6b7280;">
        If you already have an account, sign in to continue. If you are new, create an account to open your invited dashboard.
      </div>
    `,
    footerNote: 'This invite is linked to one specific baby profile only.',
  })
}
