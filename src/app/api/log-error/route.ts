import { NextResponse } from 'next/server'
import { logError } from '@/lib/admin/error-log'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = String(body.errorMessage || '').slice(0, 2000)
    if (!message) {
      return NextResponse.json({ error: 'errorMessage required' }, { status: 400 })
    }
    await logError({
      errorType: String(body.errorType || 'client_error').slice(0, 100),
      errorMessage: message,
      errorStack: body.errorStack ? String(body.errorStack).slice(0, 8000) : null,
      endpoint: body.endpoint ? String(body.endpoint).slice(0, 500) : null,
      httpMethod: body.httpMethod ? String(body.httpMethod).slice(0, 10) : null,
      severity: (body.severity as 'low' | 'medium' | 'high' | 'critical') || 'medium',
      metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {},
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 })
  }
}
