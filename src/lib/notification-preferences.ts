import type { Json } from '@/types/supabase'

export type NotificationPreferences = {
  familyInvites: boolean
  insights: boolean
  community: boolean
  emailProductUpdates: boolean
  inAppSound: boolean
  highlightBell: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  familyInvites: true,
  insights: true,
  community: true,
  emailProductUpdates: true,
  inAppSound: true,
  highlightBell: true,
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

  return {
    sound: categoryAllowed && prefs.inAppSound,
    highlight: categoryAllowed && prefs.highlightBell,
  }
}
