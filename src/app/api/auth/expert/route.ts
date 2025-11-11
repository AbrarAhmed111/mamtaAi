import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const professionalTitle = (body?.professionalTitle || '').toString()
    const licenseNumber = (body?.licenseNumber || '').toString()
    const yearsOfExperience = (body?.yearsOfExperience || '').toString()

    if (!professionalTitle || !licenseNumber || !yearsOfExperience) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'expert',
        is_verified: false,
        verification_data: {
          professionalTitle,
          licenseNumber,
          yearsOfExperience,
          documents: [],
        },
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}


