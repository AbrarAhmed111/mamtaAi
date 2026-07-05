import { createAdminAlertEmailTemplate } from '@/lib/email/templates/admin-alert-email-template'
import { getInviteEmailLogoMailParts } from '@/lib/email/invite-email-logo'
import { sendEmail } from '@/lib/email/send-email'
import {
  parseNotificationPreferences,
  isAdminEventCategoryEnabled,
  type NotificationPreferences,
} from '@/lib/notification-preferences'
import { supabaseAdmin } from '@/lib/supabase/client'

export type AdminNotificationEvent =
  | 'content_report'
  | 'expert_application'
  | 'user_signup'
  | 'subscription_issue'
  | 'system_error'
  | 'coupon_usage'
  | 'admin_action'

export type NotifyAdminsInput = {
  event: AdminNotificationEvent
  title: string
  body: string
  actionUrl: string
  actionData?: Record<string, unknown>
  priority?: 'normal' | 'high' | 'urgent'
  emailHeading?: string
  /** Skip this admin (e.g. the actor who triggered the event). */
  excludeAdminId?: string
}

type AdminRecipient = {
  id: string
  fullName: string
  email: string | null
  prefs: NotificationPreferences
}

function getSiteBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NODE_ENV === 'production') return 'https://mamtaai.vercel.app'
  return 'http://localhost:3000'
}

async function listAdminRecipients(): Promise<AdminRecipient[]> {
  const { data: profiles, error } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id, full_name, metadata')
    .eq('role', 'admin')

  if (error || !profiles?.length) return []

  const recipients: AdminRecipient[] = []
  for (const row of profiles as { id: string; full_name: string; metadata: unknown }[]) {
    let email: string | null = null
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(row.id)
      email = authUser.user?.email ?? null
    } catch {
      email = null
    }
    recipients.push({
      id: row.id,
      fullName: row.full_name || 'Admin',
      email,
      prefs: parseNotificationPreferences(row.metadata),
    })
  }
  return recipients
}

async function insertAdminInAppNotification(
  adminId: string,
  input: NotifyAdminsInput,
): Promise<void> {
  await (supabaseAdmin as any).from('notifications').insert({
    user_id: adminId,
    title: input.title,
    body: input.body,
    notification_type: 'system',
    category: 'admin',
    priority: input.priority ?? 'high',
    action_type: 'admin',
    action_url: input.actionUrl,
    action_data: {
      event: input.event,
      ...(input.actionData ?? {}),
    },
    metadata: { source: 'admin_alert', event: input.event },
    sent_at: new Date().toISOString(),
  })
}

async function sendAdminEmail(
  recipient: AdminRecipient,
  input: NotifyAdminsInput,
  absoluteActionUrl: string,
): Promise<void> {
  if (!recipient.email) return
  if (recipient.prefs.emailAdminAlerts === false) return
  if (!isAdminEventCategoryEnabled(recipient.prefs, input.event, input.actionData)) return

  const siteBase = getSiteBaseUrl()
  const { logoUrl, attachments } = getInviteEmailLogoMailParts(siteBase)
  const html = createAdminAlertEmailTemplate({
    adminName: recipient.fullName,
    heading: input.emailHeading ?? input.title,
    body: input.body,
    actionUrl: absoluteActionUrl,
    logoUrl: logoUrl || undefined,
  })

  const result = await sendEmail({
    to: recipient.email,
    subject: `[MumtaAI Admin] ${input.title}`,
    html,
    attachments,
  })

  if (!result.ok) {
    console.warn('[admin-notifications] email failed', recipient.id, result.error)
  }
}

/** In-app (realtime) + optional email alerts for every admin account. */
export async function notifyAdmins(input: NotifyAdminsInput): Promise<void> {
  try {
    const admins = await listAdminRecipients()
    if (!admins.length) return

    const siteBase = getSiteBaseUrl()
    const path = input.actionUrl.startsWith('/') ? input.actionUrl : `/${input.actionUrl}`
    const absoluteActionUrl = `${siteBase}${path}`

    await Promise.all(
      admins.map(async admin => {
        if (input.excludeAdminId && admin.id === input.excludeAdminId) return

        const categoryEnabled = isAdminEventCategoryEnabled(
          admin.prefs,
          input.event,
          input.actionData,
        )
        if (!categoryEnabled) return

        if (admin.prefs.adminAlerts !== false) {
          await insertAdminInAppNotification(admin.id, input)
        }
        await sendAdminEmail(admin, input, absoluteActionUrl)
      }),
    )
  } catch (e) {
    console.error('[admin-notifications]', e)
  }
}

/** Fire-and-forget wrapper for API routes and server actions. */
export function notifyAdminsAsync(input: NotifyAdminsInput): void {
  void notifyAdmins(input)
}

const errorNotifyCooldownMs = 5 * 60 * 1000
const lastErrorNotifyAt = new Map<string, number>()

const subscriptionNotifyCooldownMs = 15 * 60 * 1000
const lastSubscriptionNotifyAt = new Map<string, number>()

function shouldNotifySubscription(key: string, cooldownMs = subscriptionNotifyCooldownMs): boolean {
  const now = Date.now()
  if (now - (lastSubscriptionNotifyAt.get(key) ?? 0) < cooldownMs) return false
  lastSubscriptionNotifyAt.set(key, now)
  return true
}

async function getProfileLabel(userId: string): Promise<{ fullName: string; role: string }> {
  try {
    const { data } = await (supabaseAdmin as any)
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .maybeSingle()
    return {
      fullName: (data?.full_name as string) || 'A user',
      role: (data?.role as string) || 'parent',
    }
  } catch {
    return { fullName: 'A user', role: 'parent' }
  }
}

function capitalizeRole(role: string): string {
  if (!role) return role
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function notifyAdminsOfSystemError(params: {
  errorType: string
  errorMessage: string
  endpoint?: string | null
  severity: 'high' | 'critical'
}): void {
  const key = `${params.errorType}:${params.endpoint ?? 'unknown'}`
  const now = Date.now()
  if (now - (lastErrorNotifyAt.get(key) ?? 0) < errorNotifyCooldownMs) return
  lastErrorNotifyAt.set(key, now)

  const shortMessage =
    params.errorMessage.length > 160
      ? `${params.errorMessage.slice(0, 159)}…`
      : params.errorMessage

  notifyAdminsAsync({
    event: 'system_error',
    title: params.severity === 'critical' ? 'Critical system error' : 'System error logged',
    body: `${params.errorType}: ${shortMessage}`,
    actionUrl: '/dashboard/admin/logs',
    priority: params.severity === 'critical' ? 'urgent' : 'high',
    emailHeading: 'System error requires review',
    actionData: {
      errorType: params.errorType,
      endpoint: params.endpoint ?? null,
      severity: params.severity,
    },
  })
}

export function notifyAdminsOfContentReport(params: {
  reportId: string
  contentType: string
  contentId: string
  reason: string | null
  reporterName: string
}): void {
  const label = params.contentType.replace(/_/g, ' ')
  notifyAdminsAsync({
    event: 'content_report',
    title: 'New content report',
    body: `${params.reporterName} reported ${label}${params.reason ? `: ${params.reason}` : '.'}`,
    actionUrl: '/dashboard/admin/moderation',
    priority: 'high',
    emailHeading: 'New moderation report',
    actionData: {
      reportId: params.reportId,
      contentType: params.contentType,
      contentId: params.contentId,
    },
  })
}

export function notifyAdminsOfExpertApplication(params: {
  userId: string
  fullName: string
  professionalTitle?: string | null
  applicationId?: string | null
}): void {
  notifyAdminsOfUserSignup({
    userId: params.userId,
    fullName: params.fullName,
    role: 'expert_application',
    professionalTitle: params.professionalTitle,
    applicationId: params.applicationId ?? null,
  })
}

export function notifyAdminsOfUserSignup(params: {
  userId: string
  fullName: string
  role: string
  email?: string | null
  professionalTitle?: string | null
  applicationId?: string | null
}): void {
  const role = params.role.toLowerCase()
  const roleLabel = capitalizeRole(role === 'expert_application' ? 'expert' : role)
  const isExpert = role === 'expert' || role === 'expert_application'
  const isParent = role === 'parent'
  const emailPart = params.email ? ` (${params.email})` : ''

  notifyAdminsAsync({
    event: 'user_signup',
    title: isExpert ? 'New expert signup' : isParent ? 'New parent signed up' : 'New user signed up',
    body: isExpert
      ? `${params.fullName}${params.professionalTitle ? ` (${params.professionalTitle})` : ''} registered as an expert${emailPart}. Verification is required.`
      : `${params.fullName} registered as ${roleLabel}${emailPart}.`,
    actionUrl: isExpert ? '/dashboard/admin/experts' : `/dashboard/admin/users/${params.userId}`,
    priority: isExpert ? 'high' : 'normal',
    emailHeading: isExpert
      ? 'New expert needs verification'
      : isParent
        ? 'New parent joined MumtaAI'
        : 'New platform signup',
    actionData: {
      userId: params.userId,
      role: isExpert ? 'expert_application' : role,
      requiresExpertReview: isExpert,
      applicationId: params.applicationId ?? null,
    },
  })
}

export type SubscriptionIssueKind =
  | 'payment_failed'
  | 'subscription_cancelled'
  | 'cancel_scheduled'
  | 'scheduled_downgrade'
  | 'new_paid_subscription'
  | 'plan_changed'
  | 'plan_upgraded'
  | 'admin_override'

export function notifyAdminsOfSubscriptionIssue(params: {
  userId: string
  userName?: string
  issueKind: SubscriptionIssueKind
  planSlug?: string | null
  detail?: string | null
}): void {
  const cooldownKey =
    params.issueKind === 'plan_changed' || params.issueKind === 'plan_upgraded'
      ? `plan_change:${params.userId}`
      : `${params.issueKind}:${params.userId}`
  const cooldownMs =
    params.issueKind === 'cancel_scheduled' || params.issueKind === 'scheduled_downgrade'
      ? 60 * 60 * 1000
      : subscriptionNotifyCooldownMs

  if (!shouldNotifySubscription(cooldownKey, cooldownMs)) return

  const name = params.userName || 'A user'
  const plan = params.planSlug ? ` (${params.planSlug})` : ''

  const copy: Record<
    SubscriptionIssueKind,
    { title: string; body: string; priority: 'normal' | 'high' | 'urgent' }
  > = {
    payment_failed: {
      title: 'Subscription payment failed',
      body: `${name}'s subscription payment failed${plan}.${params.detail ? ` ${params.detail}` : ''}`,
      priority: 'high',
    },
    subscription_cancelled: {
      title: 'Subscription ended',
      body: `${name}'s paid subscription was cancelled${plan} and they were moved to Free.`,
      priority: 'normal',
    },
    cancel_scheduled: {
      title: 'Subscription cancellation scheduled',
      body: `${name} scheduled cancellation at period end${plan}.`,
      priority: 'normal',
    },
    scheduled_downgrade: {
      title: 'Plan downgrade scheduled',
      body: `${name} scheduled a plan change${plan ? ` to ${params.planSlug}` : ''}.${params.detail ? ` ${params.detail}` : ''}`,
      priority: 'normal',
    },
    new_paid_subscription: {
      title: 'New paid subscription',
      body: `${name} subscribed to ${params.planSlug || 'a paid plan'}.`,
      priority: 'normal',
    },
    plan_changed: {
      title: 'Subscription plan changed',
      body: `${name}'s plan changed${plan}.${params.detail ? ` ${params.detail}` : ''}`,
      priority: 'normal',
    },
    plan_upgraded: {
      title: 'Subscription upgraded',
      body: `${name} upgraded to ${params.planSlug || 'a higher plan'}.`,
      priority: 'normal',
    },
    admin_override: {
      title: 'Admin changed subscription',
      body: `${name}'s subscription was updated by an admin${plan}.${params.detail ? ` ${params.detail}` : ''}`,
      priority: 'high',
    },
  }

  const msg = copy[params.issueKind]

  notifyAdminsAsync({
    event: 'subscription_issue',
    title: msg.title,
    body: msg.body,
    actionUrl: '/dashboard/admin/subscriptions',
    priority: msg.priority,
    emailHeading: msg.title,
    actionData: {
      userId: params.userId,
      issueKind: params.issueKind,
      planSlug: params.planSlug ?? null,
    },
  })
}

/** Resolve profile name then notify — safe for fire-and-forget from webhooks. */
export function notifyAdminsOfSubscriptionIssueAsync(params: {
  userId: string
  issueKind: SubscriptionIssueKind
  planSlug?: string | null
  detail?: string | null
}): void {
  void (async () => {
    const profile = await getProfileLabel(params.userId)
    notifyAdminsOfSubscriptionIssue({
      userId: params.userId,
      userName: profile.fullName,
      issueKind: params.issueKind,
      planSlug: params.planSlug,
      detail: params.detail,
    })
  })()
}

export function notifyAdminsOfCouponUsed(params: {
  code: string
  userId: string
  planSlug?: string | null
}): void {
  void (async () => {
    const profile = await getProfileLabel(params.userId)
    const planPart = params.planSlug ? ` on ${params.planSlug}` : ''
    notifyAdminsAsync({
      event: 'coupon_usage',
      title: 'Coupon redeemed',
      body: `${profile.fullName} used coupon ${params.code}${planPart}.`,
      actionUrl: '/dashboard/admin/coupons',
      priority: 'normal',
      emailHeading: 'Discount coupon used',
      actionData: {
        code: params.code,
        userId: params.userId,
        planSlug: params.planSlug ?? null,
      },
    })
  })()
}

type AuditActionNotifyInput = {
  adminId: string
  action: string
  entityType: string
  entityId?: string | null
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

const NOTIFIABLE_AUDIT_ACTIONS = new Set([
  'admin_user_update',
  'admin_user_delete',
  'admin_subscription_override',
  'coupon_create',
  'coupon_update',
  'coupon_delete',
  'expert_approved',
  'expert_rejected',
  'content_remove',
  'report_dismiss',
  'report_resolve',
])

function buildAuditActionNotification(
  input: AuditActionNotifyInput,
  actorName: string,
): NotifyAdminsInput | null {
  if (!NOTIFIABLE_AUDIT_ACTIONS.has(input.action)) return null

  const expertName =
    (input.metadata?.expertName as string) ||
    (input.newValues?.full_name as string) ||
    (input.oldValues?.full_name as string) ||
    'an expert'

  const couponCode =
    (input.newValues?.code as string) ||
    (input.oldValues?.code as string) ||
    null

  const messages: Record<string, Omit<NotifyAdminsInput, 'excludeAdminId'>> = {
    admin_user_update: {
      event: 'admin_action',
      title: 'Admin updated user',
      body: `${actorName} updated a user profile.`,
      actionUrl: input.entityId ? `/dashboard/admin/users/${input.entityId}` : '/dashboard/admin/users',
      priority: 'normal',
      emailHeading: 'Admin user update',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    admin_user_delete: {
      event: 'admin_action',
      title: 'Admin deleted user',
      body: `${actorName} deleted a user account.`,
      actionUrl: '/dashboard/admin/users',
      priority: 'high',
      emailHeading: 'User account deleted',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    admin_subscription_override: {
      event: 'admin_action',
      title: 'Admin changed subscription',
      body: `${actorName} manually updated a subscription.`,
      actionUrl: '/dashboard/admin/subscriptions',
      priority: 'high',
      emailHeading: 'Subscription override',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    coupon_create: {
      event: 'admin_action',
      title: 'Coupon created',
      body: `${actorName} created coupon ${couponCode || 'code'}.`,
      actionUrl: '/dashboard/admin/coupons',
      priority: 'normal',
      emailHeading: 'New discount coupon',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    coupon_update: {
      event: 'admin_action',
      title: 'Coupon updated',
      body: `${actorName} updated coupon ${couponCode || 'code'}.`,
      actionUrl: '/dashboard/admin/coupons',
      priority: 'normal',
      emailHeading: 'Coupon updated',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    coupon_delete: {
      event: 'admin_action',
      title: 'Coupon deleted',
      body: `${actorName} deleted coupon ${couponCode || 'code'}.`,
      actionUrl: '/dashboard/admin/coupons',
      priority: 'normal',
      emailHeading: 'Coupon removed',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    expert_approved: {
      event: 'admin_action',
      title: 'Expert approved',
      body: `${actorName} approved ${expertName} as an expert.`,
      actionUrl: '/dashboard/admin/experts',
      priority: 'normal',
      emailHeading: 'Expert verified',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    expert_rejected: {
      event: 'admin_action',
      title: 'Expert application rejected',
      body: `${actorName} rejected ${expertName}'s expert application.`,
      actionUrl: '/dashboard/admin/experts',
      priority: 'normal',
      emailHeading: 'Expert rejected',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    content_remove: {
      event: 'admin_action',
      title: 'Content removed',
      body: `${actorName} removed reported community content.`,
      actionUrl: '/dashboard/admin/moderation',
      priority: 'high',
      emailHeading: 'Content removed',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    report_dismiss: {
      event: 'admin_action',
      title: 'Report dismissed',
      body: `${actorName} dismissed a moderation report.`,
      actionUrl: '/dashboard/admin/moderation',
      priority: 'normal',
      emailHeading: 'Report dismissed',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
    report_resolve: {
      event: 'admin_action',
      title: 'Report resolved',
      body: `${actorName} marked a moderation report as resolved.`,
      actionUrl: '/dashboard/admin/moderation',
      priority: 'normal',
      emailHeading: 'Report resolved',
      actionData: { action: input.action, entityId: input.entityId ?? null },
    },
  }

  return messages[input.action] ?? null
}

/** Notify all admins except the actor when another admin performs a sensitive action. */
export function notifyOtherAdminsOfAuditAction(input: AuditActionNotifyInput): void {
  if (!NOTIFIABLE_AUDIT_ACTIONS.has(input.action)) return

  void (async () => {
    try {
      const { data: actor } = await (supabaseAdmin as any)
        .from('profiles')
        .select('full_name')
        .eq('id', input.adminId)
        .maybeSingle()

      const actorName = (actor?.full_name as string) || 'An admin'
      const notification = buildAuditActionNotification(input, actorName)
      if (!notification) return

      await notifyAdmins({ ...notification, excludeAdminId: input.adminId })
    } catch (e) {
      console.error('[admin-notifications] audit action notify failed', e)
    }
  })()
}
