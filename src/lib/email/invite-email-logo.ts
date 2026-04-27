import { existsSync } from 'fs'
import { join } from 'path'
import type { Attachment } from 'nodemailer/lib/mailer'

/** Stable Content-ID for inline logo in invite HTML (`<img src="cid:…">`). */
export const INVITE_EMAIL_LOGO_CID = 'mamta-logo@mamtaai'

/**
 * Prefer embedding `public/mamta-email-logo.png` as a CID attachment so the logo works in Gmail/Outlook
 * even when the site URL is localhost (remote clients cannot fetch your dev machine).
 */
export function getInviteEmailLogoMailParts(siteBaseNoTrailingSlash: string): {
  logoUrl: string
  attachments: Attachment[]
} {
  const logoPath = join(process.cwd(), 'public', 'mamta-email-logo.png')
  if (existsSync(logoPath)) {
    return {
      logoUrl: `cid:${INVITE_EMAIL_LOGO_CID}`,
      attachments: [
        {
          filename: 'mamta-email-logo.png',
          path: logoPath,
          cid: INVITE_EMAIL_LOGO_CID,
          contentDisposition: 'inline',
        },
      ],
    }
  }
  const base = siteBaseNoTrailingSlash.replace(/\/$/, '')
  return {
    logoUrl: base ? `${base}/mamta-email-logo.png` : '',
    attachments: [],
  }
}
