export interface BaseEmailTemplateOptions {
  preheader?: string
  heading: string
  subheading?: string
  bodyHtml: string
  footerNote?: string
  /** Absolute URL to logo image (e.g. https://yoursite.com/mamta-email-logo.png) */
  logoUrl?: string | null
  /** Pink/rose palette to match MamtaAI web app (invite, marketing) */
  brandTheme?: boolean
}

const defaultColors = {
  pageBg: '#f6f8ff',
  cardBorder: '#e8edff',
  headerBg: '#eef3ff',
  headerBorder: '#dde6ff',
  eyebrow: '#5c6fa8',
  heading: '#1d2d5a',
  subheading: '#4b5e8d',
  bodyText: '#314067',
  muted: '#5e6f9a',
  mutedSmall: '#8a97bc',
  link: '#4162ff',
  footerBg: '#fbfcff',
  footerTopBorder: '#edf1ff',
}

const brandColors = {
  pageBg: '#fdf2f8',
  cardBorder: '#fce7f3',
  headerBg: '#fff1f2',
  headerBorder: '#fbcfe8',
  eyebrow: '#be185d',
  heading: '#9f1239',
  subheading: '#a21caf',
  bodyText: '#4b5563',
  muted: '#6b7280',
  mutedSmall: '#9ca3af',
  link: '#db2777',
  footerBg: '#fff7fb',
  footerTopBorder: '#fce7f3',
}

export function createBaseEmailTemplate({
  preheader = 'Mamta AI Dashboard Updates',
  heading,
  subheading,
  bodyHtml,
  footerNote = 'If you did not request this email, you can safely ignore it.',
  logoUrl,
  brandTheme = false,
}: BaseEmailTemplateOptions): string {
  const c = brandTheme ? brandColors : defaultColors

  const logoBlock =
    logoUrl && String(logoUrl).trim()
      ? `<div style="text-align:center;margin-bottom:14px;">
          <img src="${String(logoUrl).replace(/"/g, '&quot;')}" alt="MamtaAI" width="64" height="64" style="display:inline-block;width:64px;height:64px;border-radius:9999px;border:2px solid ${c.cardBorder};object-fit:cover;" />
        </div>`
      : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${c.pageBg};font-family:Arial,Helvetica,sans-serif;color:${c.bodyText};">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
      ${preheader}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.pageBg};margin:0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background-color:#ffffff;border-radius:18px;border:1px solid ${c.cardBorder};overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;background-color:${c.headerBg};border-bottom:1px solid ${c.headerBorder};">
                ${logoBlock}
                <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${c.eyebrow};margin-bottom:8px;text-align:center;">
                  MamtaAI
                </div>
                <div style="font-size:22px;line-height:30px;font-weight:700;color:${c.heading};text-align:center;">
                  ${heading}
                </div>
                ${
                  subheading
                    ? `<div style="margin-top:8px;font-size:15px;line-height:22px;color:${c.subheading};text-align:center;">${subheading}</div>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;background-color:${c.footerBg};border-top:1px solid ${c.footerTopBorder};">
                <div style="font-size:13px;line-height:20px;color:${c.muted};">
                  Need help? Contact support at
                  <a href="mailto:support@mamtaai.com" style="color:${c.link};text-decoration:none;">support@mamtaai.com</a>.
                </div>
                <div style="margin-top:8px;font-size:12px;line-height:18px;color:${c.mutedSmall};">
                  ${footerNote}
                </div>
                <div style="margin-top:10px;font-size:12px;line-height:18px;color:${c.mutedSmall};">
                  © ${new Date().getFullYear()} MamtaAI. All rights reserved.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
