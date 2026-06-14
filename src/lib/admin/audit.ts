import { getAdminDb } from './auth'
import { notifyOtherAdminsOfAuditAction } from '@/lib/notifications/admin-notifications'

export type AuditLogInput = {
  adminId: string
  action: string
  entityType: string
  entityId?: string | null
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  status?: 'success' | 'failure' | 'partial'
  errorMessage?: string | null
  metadata?: Record<string, unknown>
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await (getAdminDb() as any).from('audit_logs').insert({
      user_id: input.adminId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      old_values: input.oldValues ?? null,
      new_values: input.newValues ?? null,
      status: input.status ?? 'success',
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    })
    notifyOtherAdminsOfAuditAction(input)
  } catch (e) {
    console.error('[audit_log]', e)
  }
}
