import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireActiveProfile, buildSessionStatus } from '@/lib/session/server'

export const dynamic = 'force-dynamic'

/** Live authorization snapshot for mid-session reconciliation */
export async function GET() {
  try {
    const auth = await requireActiveProfile()
    if (!auth.ok) return auth.response

    const status = await buildSessionStatus(auth.user.id)
    return NextResponse.json(status)
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, code: 'unauthenticated', message: e instanceof Error ? e.message : 'Session check failed' },
      { status: 500 },
    )
  }
}
