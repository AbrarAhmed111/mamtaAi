import nodemailer from 'nodemailer'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

let smtpVerification: { verified: boolean; error?: string } | null = null

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST?.trim()
  const port = Number((process.env.SMTP_PORT || '587').trim())
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim()
  const secure = (process.env.SMTP_SECURE || '').trim().toLowerCase() === 'true'

  if (!host || !Number.isFinite(port) || !user || !pass || !fromEmail) {
    return { ok: false, error: 'SMTP email provider not configured' }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: secure || port === 465,
      auth: {
        user,
        pass,
      },
    })

    if (!smtpVerification?.verified) {
      try {
        await transporter.verify()
        smtpVerification = { verified: true }
      } catch (verifyError: any) {
        const message = verifyError?.message || 'SMTP connection verification failed'
        smtpVerification = { verified: false, error: message }
        return { ok: false, error: `SMTP verification failed: ${message}` }
      }
    }

    await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    })

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Failed to send email' }
  }
}
