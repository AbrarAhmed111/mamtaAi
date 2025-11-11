import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('baby_parents')
      .select(
        `
        babies (
          id,
          name,
          gender,
          birth_date,
          birth_weight_kg,
          birth_height_cm,
          blood_type,
          avatar_url,
          medical_notes,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .eq('parent_id', user.id)
      .eq('babies.is_active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const babies = (data || [])
      .map(row => (row as any).babies)
      .filter(Boolean)

    return NextResponse.json({ babies })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}



