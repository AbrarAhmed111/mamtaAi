import { createBaseEmailTemplate } from './base-template'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paragraphHtml(message: string): string {
  return escapeHtml(message)
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px;font-size:15px;line-height:24px;color:#4b5563;">${p.replace(/\n/g, '<br />')}</p>`)
    .join('')
}

export function createPromotionalEmailTemplate({
  recipientName,
  heading,
  message,
  ctaLabel,
  ctaUrl,
  offerCode,
  logoUrl,
}: {
  recipientName?: string | null
  heading: string
  message: string
  ctaLabel?: string | null
  ctaUrl?: string | null
  offerCode?: string | null
  logoUrl?: string | null
}) {
  const safeHeading = escapeHtml(heading)
  const safeName = escapeHtml(recipientName || 'there')
  const safeCtaLabel = escapeHtml(ctaLabel || 'Open MumtaAI')
  const safeCtaUrl = escapeHtml(ctaUrl || 'https://mamtaai.com')
  const safeOfferCode = offerCode ? escapeHtml(offerCode.toUpperCase()) : null

  return createBaseEmailTemplate({
    brandTheme: true,
    logoUrl,
    preheader: safeHeading,
    heading: safeHeading,
    subheading: 'A note from the MumtaAI team',
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:15px;line-height:24px;color:#4b5563;">Hi ${safeName},</p>
      ${paragraphHtml(message)}
      ${
        safeOfferCode
          ? `<div style="margin:20px 0;padding:14px 16px;border:1px solid #fbcfe8;border-radius:14px;background:#fff1f2;text-align:center;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#be185d;">Promo code</div>
              <div style="margin-top:6px;font-size:24px;font-weight:800;letter-spacing:0.12em;color:#9f1239;">${safeOfferCode}</div>
            </div>`
          : ''
      }
      <div style="margin-top:22px;text-align:center;">
        <a href="${safeCtaUrl}" style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:20px;padding:13px 28px;border-radius:12px;">
          ${safeCtaLabel}
        </a>
      </div>
    `,
    footerNote:
      'You are receiving this promotional email because you created a MumtaAI account. You can adjust promotional preferences in Settings.',
  })
}
