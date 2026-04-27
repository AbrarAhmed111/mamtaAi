import { createBaseEmailTemplate } from './base-template'

interface OtpEmailTemplateData {
  userName?: string
  otpCode?: string
  expiryMinutes?: number
}

export function createOtpEmailTemplate({
  userName = '{{user_name}}',
  otpCode = '{{otp_code}}',
  expiryMinutes = 10,
}: OtpEmailTemplateData = {}): string {
  return createBaseEmailTemplate({
    preheader: `Your verification code is ${otpCode}.`,
    heading: 'Your One-Time Passcode',
    subheading: 'Use this code to continue securely.',
    bodyHtml: `
      <div style="font-size:15px;line-height:24px;color:#314067;">
        Hi ${userName},
      </div>
      <div style="margin-top:12px;font-size:15px;line-height:24px;color:#314067;">
        Enter the OTP below to continue your verification:
      </div>
      <div style="margin-top:16px;display:inline-block;padding:12px 18px;background-color:#f1f5ff;border:1px solid #dbe4ff;border-radius:12px;">
        <span style="font-size:28px;letter-spacing:0.24em;font-weight:700;color:#1f3266;">${otpCode}</span>
      </div>
      <div style="margin-top:14px;font-size:13px;line-height:21px;color:#5a6a95;">
        This OTP expires in ${expiryMinutes} minutes. For your security, do not share this code with anyone.
      </div>
    `,
    footerNote: 'If you did not request this OTP, please change your password immediately.',
  })
}
