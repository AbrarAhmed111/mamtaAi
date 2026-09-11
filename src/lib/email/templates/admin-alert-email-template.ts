import { createBaseEmailTemplate } from './base-template'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function createAdminAlertEmailTemplate({
  adminName,
  heading,
  body,
  actionUrl,
  logoUrl,
}: {
  adminName: string
  heading: string
  body: string
  actionUrl: string
  logoUrl?: string
}): string {
  const safeName = escapeHtml(adminName || 'Admin')
  const safeHeading = escapeHtml(heading)
  const safeBody = escapeHtml(body)
  const safeUrl = escapeHtml(actionUrl)

  return createBaseEmailTemplate({
    brandTheme: true,
    logoUrl,
    preheader: body.slice(0, 120),
    heading: safeHeading,
    subheading: 'Administrator alert from MumtaAI',
    bodyHtml: `
      <div style="font-size:15px;line-height:24px;color:#4b5563;">
        Hi ${safeName},
      </div>
      <div style="margin-top:12px;font-size:15px;line-height:24px;color:#4b5563;">
        ${safeBody}
      </div>
      <div style="margin-top:20px;text-align:center;">
        <a href="${safeUrl}" style="display:inline-block;background-color:#db2777;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:20px;padding:12px 28px;border-radius:12px;">
          Open in admin panel
        </a>
      </div>
      <div style="margin-top:16px;font-size:13px;line-height:21px;color:#6b7280;">
        Or copy this link: <a href="${safeUrl}" style="color:#db2777;word-break:break-word;">${safeUrl}</a>
      </div>
    `,
    footerNote: 'You receive this because you are an administrator on MumtaAI. Update alert settings in Settings → Notifications.',
  })
}
