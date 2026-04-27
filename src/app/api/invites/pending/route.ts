import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ invites: [] })
    }

    const nowIso = new Date().toISOString()
    const { data, error } = await (supabaseAdmin as any)
      .from('baby_invites')
      .select('id, invite_token, invited_email, relationship, status, expires_at, babies(name)')
      .eq('invited_email', user.email.toLowerCase())
      .eq('status', 'waiting')
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
      .order('invited_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message, invites: [] }, { status: 400 })

    const invites = (data || []).map((item: any) => ({
      id: item.id,
      token: item.invite_token,
      email: item.invited_email,
      relationship: item.relationship || 'other',
      status: item.status,
      babyName: item?.babies?.name || 'Baby',
    }))

    return NextResponse.json({ invites })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error', invites: [] }, { status: 500 })
  }
}

