import { createBaseEmailTemplate } from './base-template'

interface ForgotPasswordTemplateData {
  userName?: string
  resetLink?: string
  expiryMinutes?: number
}

export function createForgotPasswordEmailTemplate({
  userName = '{{user_name}}',
  resetLink = '{{reset_link}}',
  expiryMinutes = 60,
}: ForgotPasswordTemplateData = {}): string {
  return createBaseEmailTemplate({
    preheader: 'Reset your Mamta AI account password.',
    heading: 'Reset Your Password',
    subheading: 'A secure link to update your password is ready.',
    bodyHtml: `
      <div style="font-size:15px;line-height:24px;color:#314067;">
        Hi ${userName},
      </div>
      <div style="margin-top:12px;font-size:15px;line-height:24px;color:#314067;">
        We received a request to reset your Mamta AI password. Use the button below to set a new password.
      </div>
      <div style="margin-top:20px;">
        <a href="${resetLink}" style="display:inline-block;background-color:#4f6cff;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:20px;padding:12px 22px;border-radius:10px;">
          Reset Password
        </a>
      </div>
      <div style="margin-top:16px;font-size:13px;line-height:21px;color:#5a6a95;">
        If the button does not work, use this link:
        <br />
        <a href="${resetLink}" style="color:#4162ff;word-break:break-word;text-decoration:none;">${resetLink}</a>
      </div>
      <div style="margin-top:16px;font-size:13px;line-height:21px;color:#5a6a95;">
        This password reset link expires in ${expiryMinutes} minutes.
      </div>
      <div style="margin-top:10px;font-size:13px;line-height:21px;color:#5a6a95;">
        For your account security, if you did not request this reset, ignore this email and keep your credentials private.
      </div>
    `,
    footerNote: 'Never share your password or reset link with anyone.',
  })
}
