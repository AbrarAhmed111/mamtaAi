import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * Invited / secondary caregivers can remove their own link to a baby (leave profile).
 * Primary parent cannot use this route — use baby delete or transfer flows instead.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: babyId } = await params

    const { data: row, error: selErr } = await supabase
      .from('baby_parents')
      .select('id, is_primary')
      .eq('baby_id', babyId)
      .eq('parent_id', user.id)
      .maybeSingle()

    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 400 })
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (row.is_primary) {
      return NextResponse.json(
        {
          error:
            'The primary parent cannot leave this profile here. Delete the child profile or ask support if you need to transfer primary access.',
        },
        { status: 400 },
      )
    }

    const { error: delErr } = await (supabaseAdmin as any).from('baby_parents').delete().eq('id', row.id)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
