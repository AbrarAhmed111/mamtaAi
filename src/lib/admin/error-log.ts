import { getAdminDb } from './auth'
import { notifyAdminsOfSystemError } from '@/lib/notifications/admin-notifications'

export type ErrorLogInput = {
  errorType: string
  errorMessage: string
  errorStack?: string | null
  userId?: string | null
  endpoint?: string | null
  httpMethod?: string | null
  requestBody?: Record<string, unknown> | null
  severity?: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, unknown>
}

export async function logError(input: ErrorLogInput): Promise<void> {
  try {
    await (getAdminDb() as any).from('error_logs').insert({
      user_id: input.userId ?? null,
      error_type: input.errorType,
      error_message: input.errorMessage,
      error_stack: input.errorStack ?? null,
      endpoint: input.endpoint ?? null,
      http_method: input.httpMethod ?? null,
      request_body: input.requestBody ?? null,
      severity: input.severity ?? 'medium',
      metadata: input.metadata ?? {},
    })

    const severity = input.severity ?? 'medium'
    if (severity === 'high' || severity === 'critical') {
      notifyAdminsOfSystemError({
        errorType: input.errorType,
        errorMessage: input.errorMessage,
        endpoint: input.endpoint ?? null,
        severity,
      })
    }
  } catch (e) {
    console.error('[error_log]', e)
  }
}
