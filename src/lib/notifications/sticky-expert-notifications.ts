/** Mark sticky expert alerts read for all admins when an application is resolved. */
export async function markExpertReviewNotificationsReadForApplicant(
  applicantUserId: string,
): Promise<void> {
  const { supabaseAdmin } = await import('@/lib/supabase/client')

  const { data: admins } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  if (!admins?.length) return

  for (const admin of admins as { id: string }[]) {
    const { data: rows } = await (supabaseAdmin as any)
      .from('notifications')
      .select('id, action_data')
      .eq('user_id', admin.id)
      .eq('is_read', false)

    const ids = (rows || [])
      .filter((row: { action_data: unknown }) => {
        if (!stickyExpertReviewFilter(row.action_data)) return false
        const d = row.action_data as Record<string, unknown>
        return String(d.userId ?? '') === applicantUserId
      })
      .map((row: { id: string }) => row.id)

    if (!ids.length) continue

    await (supabaseAdmin as any)
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() } as any)
      .in('id', ids)
  }
}

export function isStickyExpertReviewNotification(actionData: unknown): boolean {
  if (!actionData || typeof actionData !== 'object' || Array.isArray(actionData)) return false
  const d = actionData as Record<string, unknown>
  if (d.requiresExpertReview === true) return true
  const event = String(d.event ?? '')
  const role = String(d.role ?? '').toLowerCase()
  return event === 'user_signup' && (role === 'expert' || role === 'expert_application')
}

export function hasUnreadStickyExpertReviewNotifications(
  items: { isRead?: boolean; actionData?: unknown }[],
): boolean {
  return items.some(n => !n.isRead && isStickyExpertReviewNotification(n.actionData))
}

export function stickyExpertReviewFilter(actionData: unknown): boolean {
  return isStickyExpertReviewNotification(actionData)
}
