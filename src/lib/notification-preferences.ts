import type { Json } from '@/types/supabase'

export type AdminNotifyCategory =
  | 'signups'
  | 'experts'
  | 'subscriptions'
  | 'moderation'
  | 'coupons'
  | 'adminActions'
  | 'systemErrors'

export type NotificationPreferences = {
  familyInvites: boolean
  insights: boolean
  community: boolean
  emailProductUpdates: boolean
  inAppSound: boolean
  highlightBell: boolean
  /** Master in-app switch for admin panel alerts. */
  adminAlerts: boolean
  /** Master email switch for admin panel alerts. */
  emailAdminAlerts: boolean
  /** New parent and non-expert user signups. */
  adminNotifySignups: boolean
  /** Expert signup / verification requests. */
  adminNotifyExperts: boolean
  /** Subscriptions, plan changes, payment failures, cancellations. */
  adminNotifySubscriptions: boolean
  /** Content reports (posts, threads, replies, comments). */
  adminNotifyModeration: boolean
  /** Discount coupon redemptions at checkout. */
  adminNotifyCoupons: boolean
  /** Actions performed by other admins (audit log events). */
  adminNotifyAdminActions: boolean
  /** High/critical system errors from the error log. */
  adminNotifySystemErrors: boolean
  /** Low SpO₂ alerts from connected oximeter. */
  oximeterSpo2: boolean
  /** High/low pulse alerts from connected oximeter. */
  oximeterPulse: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  familyInvites: true,
  insights: true,
  community: true,
  emailProductUpdates: true,
  inAppSound: true,
  highlightBell: true,
  adminAlerts: true,
  emailAdminAlerts: true,
  adminNotifySignups: true,
  adminNotifyExperts: true,
  adminNotifySubscriptions: true,
  adminNotifyModeration: true,
  adminNotifyCoupons: true,
  adminNotifyAdminActions: true,
  adminNotifySystemErrors: true,
  oximeterSpo2: true,
  oximeterPulse: true,
}

const ADMIN_CATEGORY_PREF: Record<AdminNotifyCategory, keyof NotificationPreferences> = {
  signups: 'adminNotifySignups',
  experts: 'adminNotifyExperts',
  subscriptions: 'adminNotifySubscriptions',
  moderation: 'adminNotifyModeration',
  coupons: 'adminNotifyCoupons',
  adminActions: 'adminNotifyAdminActions',
  systemErrors: 'adminNotifySystemErrors',
}

export function adminCategoryFromEvent(
  event: string,
  actionData?: Record<string, unknown> | null,
): AdminNotifyCategory | null {
  switch (event) {
    case 'user_signup':
      return actionData?.role === 'expert' || actionData?.role === 'expert_application' ? 'experts' : 'signups'
    case 'expert_application':
      return 'experts'
    case 'subscription_issue':
      return 'subscriptions'
    case 'content_report':
      return 'moderation'
    case 'coupon_usage':
      return 'coupons'
    case 'admin_action':
      return 'adminActions'
    case 'system_error':
      return 'systemErrors'
    default:
      return null
  }
}

/** Whether this admin alert category is enabled (defaults to true when unknown). */
export function isAdminEventCategoryEnabled(
  prefs: NotificationPreferences,
  event: string,
  actionData?: Record<string, unknown> | null,
): boolean {
  const category = adminCategoryFromEvent(event, actionData)
  if (!category) return true
  const key = ADMIN_CATEGORY_PREF[category]
  return prefs[key] !== false
}

export function parseNotificationPreferences(metadata: unknown): NotificationPreferences {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  }
  const raw = (metadata as Record<string, unknown>).notificationPreferences
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  }
  const p = raw as Record<string, unknown>
  return {
    familyInvites: p.familyInvites !== false,
    insights: p.insights !== false,
    community: p.community !== false,
    emailProductUpdates: p.emailProductUpdates !== false,
    inAppSound: p.inAppSound !== false,
    highlightBell: p.highlightBell !== false,
    adminAlerts: p.adminAlerts !== false,
    emailAdminAlerts: p.emailAdminAlerts !== false,
    adminNotifySignups: p.adminNotifySignups !== false,
    adminNotifyExperts: p.adminNotifyExperts !== false,
    adminNotifySubscriptions: p.adminNotifySubscriptions !== false,
    adminNotifyModeration: p.adminNotifyModeration !== false,
    adminNotifyCoupons: p.adminNotifyCoupons !== false,
    adminNotifyAdminActions: p.adminNotifyAdminActions !== false,
    adminNotifySystemErrors: p.adminNotifySystemErrors !== false,
    oximeterSpo2: p.oximeterSpo2 !== false,
    oximeterPulse: p.oximeterPulse !== false,
  }
}

/** Merge validated preference keys from the client into stored profile metadata. */
export function sanitizeNotificationPreferencesPatch(
  input: unknown,
): Partial<NotificationPreferences> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const src = input as Record<string, unknown>
  const out: Partial<NotificationPreferences> = {}
  const keys: (keyof NotificationPreferences)[] = [
    'familyInvites',
    'insights',
    'community',
    'emailProductUpdates',
    'inAppSound',
    'highlightBell',
    'adminAlerts',
    'emailAdminAlerts',
    'adminNotifySignups',
    'adminNotifyExperts',
    'adminNotifySubscriptions',
    'adminNotifyModeration',
    'adminNotifyCoupons',
    'adminNotifyAdminActions',
    'adminNotifySystemErrors',
    'oximeterSpo2',
    'oximeterPulse',
  ]
  for (const k of keys) {
    if (typeof src[k] === 'boolean') out[k] = src[k] as boolean
  }
  return out
}

export function mergeNotificationPreferencesIntoMetadata(
  previousMetadata: Json | null,
  patch: Partial<NotificationPreferences>,
): Json {
  const base =
    previousMetadata && typeof previousMetadata === 'object' && !Array.isArray(previousMetadata)
      ? { ...(previousMetadata as Record<string, unknown>) }
      : {}
  const current = parseNotificationPreferences(base)
  base.notificationPreferences = { ...current, ...patch }
  return base as Json
}

/** Whether to play sound / animate bell for this DB row (list still updates). */
export function getInAppAlertFlagsForNotificationRow(
  row: Record<string, unknown>,
  prefs: NotificationPreferences,
): { sound: boolean; highlight: boolean } {
  const cat = String(row.category || '').toLowerCase()
  let categoryAllowed = true
  if (cat === 'invite') categoryAllowed = prefs.familyInvites
  else if (cat === 'insight' || cat === 'insights') categoryAllowed = prefs.insights
  else if (cat === 'community' || cat === 'forum' || cat === 'blog') categoryAllowed = prefs.community
  else if (cat === 'admin') {
    const actionData =
      row.action_data && typeof row.action_data === 'object' && !Array.isArray(row.action_data)
        ? (row.action_data as Record<string, unknown>)
        : null
    const event = String(
      actionData?.event ?? (row.metadata as Record<string, unknown> | undefined)?.event ?? '',
    )
    categoryAllowed =
      prefs.adminAlerts !== false &&
      isAdminEventCategoryEnabled(prefs, event, actionData)
  } else if (cat === 'oximeter') {
    const actionData =
      row.action_data && typeof row.action_data === 'object' && !Array.isArray(row.action_data)
        ? (row.action_data as Record<string, unknown>)
        : null
    const breaches = Array.isArray(actionData?.breaches)
      ? (actionData.breaches as string[])
      : []
    const hasSpo2 = breaches.some(b => b === 'spo2_low' || b === 'spo2_high')
    const hasPulse = breaches.some(b => b === 'pulse_low' || b === 'pulse_high')
    categoryAllowed =
      (hasSpo2 && prefs.oximeterSpo2 !== false) ||
      (hasPulse && prefs.oximeterPulse !== false) ||
      (breaches.length === 0 && (prefs.oximeterSpo2 !== false || prefs.oximeterPulse !== false))
  }

  return {
    sound: categoryAllowed && prefs.inAppSound,
    highlight: categoryAllowed && prefs.highlightBell,
  }
}
