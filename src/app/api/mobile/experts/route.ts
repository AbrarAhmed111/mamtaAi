import { NextResponse, type NextRequest } from 'next/server'
import { requireMobileAuth } from '@/lib/mobile/auth'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireMobileAuth(request)
  if (!auth.ok) return auth.response

  const { data, error } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id, full_name, role, is_expert, is_verified, verification_data')
    .or('role.eq.expert,is_expert.eq.true')
    .order('full_name', { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    experts: (data || []).map((expert: any) => ({
      id: expert.id,
      fullName: expert.full_name || 'MumtaAI expert',
      specialty: expert.verification_data?.specialty || expert.verification_data?.professional_title || null,
      verified: Boolean(expert.is_verified),
    })),
  })
}

