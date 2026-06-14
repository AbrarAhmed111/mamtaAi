import { NextResponse, type NextRequest } from 'next/server'
import { requireActiveProfile } from '@/lib/session/server'
import {
  mergeNotificationPreferencesIntoMetadata,
  sanitizeNotificationPreferencesPatch,
} from '@/lib/notification-preferences'

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireActiveProfile()
    if (!auth.ok) return auth.response

    return NextResponse.json({ profile: auth.profile })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireActiveProfile()
    if (!auth.ok) return auth.response

    const { user, profile, supabase } = auth

    const body = await request.json()
    const { full_name, phone_number, avatar_url, notification_preferences } = body

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (phone_number !== undefined) updateData.phone_number = phone_number
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url

    if (notification_preferences !== undefined) {
      const patch = sanitizeNotificationPreferencesPatch(notification_preferences)
      if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: 'No valid notification preference fields' }, { status: 400 })
      }
      const { data: existing, error: metaErr } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', user.id)
        .single()
      if (metaErr) {
        return NextResponse.json({ error: metaErr.message }, { status: 500 })
      }
      updateData.metadata = mergeNotificationPreferencesIntoMetadata(existing?.metadata ?? null, patch)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}



