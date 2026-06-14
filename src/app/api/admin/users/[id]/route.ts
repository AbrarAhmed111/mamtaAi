import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, requireAdminApi, writeAuditLog } from '@/lib/admin'
import { formatAccountType, isValidDbRole } from '@/lib/expert/profile-role'
import { revokeAllUserSessions } from '@/lib/session/server'

export const dynamic = 'force-dynamic'

type RouteCtx = { params: Promise<{ id: string }> }

function mapVerificationData(vd: Record<string, unknown> | null) {
  if (!vd) return null
  return {
    professionalTitle: (vd.professional_title ?? vd.title ?? null) as string | null,
    yearsOfExperience: (vd.years_of_experience ?? null) as string | null,
    licenseNumber: (vd.license_number ?? null) as string | null,
    bio: (vd.bio ?? null) as string | null,
    credentials: vd.credentials ?? null,
  }
}

export async function GET(_request: NextRequest, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  const db = getAdminDb()

  const { data: profile, error } = await (db as any)
    .from('profiles')
    .select(
      'id, full_name, phone_number, role, is_expert, is_verified, avatar_url, created_at, updated_at, last_active_at, metadata, verification_data, timezone, onboarding_completed',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const [
    authUserResult,
    babiesResult,
    recordingsCountResult,
    subscriptionResult,
    recentRecordingsResult,
  ] = await Promise.all([
    db.auth.admin.getUserById(id),
    (db as any)
      .from('baby_parents')
      .select(
        `
        id,
        relationship,
        is_primary,
        access_level,
        invitation_status,
        baby:babies!baby_parents_baby_id_fkey (
          id,
          name,
          avatar_url,
          birth_date,
          gender,
          is_active
        )
      `,
      )
      .eq('parent_id', id)
      .order('created_at', { ascending: false }),
    (db as any)
      .from('recordings')
      .select('id', { count: 'exact', head: true })
      .eq('recorded_by', id),
    (db as any)
      .from('user_subscriptions')
      .select(
        'id, status, current_period_end, plan:subscription_plans!user_subscriptions_plan_id_fkey(slug, name, price_usd)',
      )
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    (db as any)
      .from('recordings')
      .select(
        `
        id,
        duration_seconds,
        recorded_at,
        processing_status,
        baby:babies!recordings_baby_id_fkey ( name )
      `,
      )
      .eq('recorded_by', id)
      .order('recorded_at', { ascending: false })
      .limit(10),
  ])

  const meta = (profile.metadata as Record<string, unknown>) || {}
  const email = authUserResult.data.user?.email ?? null
  const emailConfirmed = Boolean(authUserResult.data.user?.email_confirmed_at)

  const babies = (babiesResult.data || []).map((row: Record<string, unknown>) => {
    const baby = row.baby as Record<string, unknown> | null
    return {
      linkId: row.id,
      babyId: baby?.id ?? null,
      name: baby?.name ?? 'Unknown',
      avatarUrl: baby?.avatar_url ?? null,
      birthDate: baby?.birth_date ?? null,
      gender: baby?.gender ?? null,
      isActive: baby?.is_active ?? true,
      relationship: row.relationship,
      isPrimary: row.is_primary,
      accessLevel: row.access_level,
      invitationStatus: row.invitation_status,
    }
  })

  const subscription = subscriptionResult.data

  return NextResponse.json({
    user: {
      id: profile.id,
      fullName: profile.full_name,
      phoneNumber: profile.phone_number,
      email,
      emailConfirmed,
      role: profile.role,
      isExpert: profile.is_expert === true,
      accountType: formatAccountType(profile.role, profile.is_expert),
      isVerified: profile.is_verified,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      lastActiveAt: profile.last_active_at,
      timezone: profile.timezone,
      onboardingCompleted: profile.onboarding_completed,
      suspended: Boolean(meta.suspended),
      suspensionReason: (meta.suspension_reason as string) ?? null,
      suspendedAt: (meta.suspended_at as string) ?? null,
      verification: mapVerificationData(profile.verification_data as Record<string, unknown> | null),
    },
    stats: {
      babies: babies.filter((b: { invitationStatus: string }) => b.invitationStatus === 'accepted').length,
      recordings: recordingsCountResult.count ?? 0,
    },
    babies,
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          planSlug: subscription.plan?.slug,
          planName: subscription.plan?.name,
          priceUsd: subscription.plan?.price_usd,
        }
      : null,
    recentRecordings: (recentRecordingsResult.data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      durationSeconds: r.duration_seconds,
      recordedAt: r.recorded_at,
      processingStatus: r.processing_status,
      babyName: (r.baby as Record<string, unknown> | null)?.name ?? 'Unknown',
    })),
  })
}

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  if (id === auth.admin.id) {
    return NextResponse.json({ error: 'Cannot modify your own admin account' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const db = getAdminDb()

  const { data: existing, error: fetchError } = await (db as any)
    .from('profiles')
    .select('id, full_name, phone_number, avatar_url, role, is_expert, is_verified, metadata')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const oldMeta = (existing.metadata as Record<string, unknown>) || {}
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const newMeta = { ...oldMeta }

  if (body.fullName !== undefined) {
    const fullName = String(body.fullName).trim()
    if (!fullName) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    updates.full_name = fullName
  }

  if (body.phoneNumber !== undefined) {
    updates.phone_number = body.phoneNumber ? String(body.phoneNumber).trim() : null
  }

  if (body.avatarUrl !== undefined) {
    updates.avatar_url = body.avatarUrl ? String(body.avatarUrl).trim() : null
  }

  if (body.role !== undefined) {
    const role = String(body.role)
    if (!isValidDbRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    updates.role = role
    if (role === 'parent') updates.is_verified = true
    if (role === 'admin') updates.is_expert = false
  }

  if (body.isExpert !== undefined) {
    updates.is_expert = Boolean(body.isExpert)
    if (updates.is_expert) {
      updates.is_verified = true
      if (!updates.role && existing.role !== 'admin') {
        updates.role = 'parent'
      }
    }
  }

  if (body.isVerified !== undefined) {
    updates.is_verified = Boolean(body.isVerified)
  }

  if (body.suspended !== undefined) {
    if (body.suspended) {
      newMeta.suspended = true
      newMeta.suspension_reason = body.suspensionReason || 'Account suspended by administrator'
      newMeta.suspended_at = new Date().toISOString()
      newMeta.suspended_by = auth.admin.id
    } else {
      delete newMeta.suspended
      delete newMeta.suspension_reason
      delete newMeta.suspended_at
      delete newMeta.suspended_by
    }
    updates.metadata = newMeta
  } else if (body.suspensionReason !== undefined && oldMeta.suspended) {
    newMeta.suspension_reason = String(body.suspensionReason)
    updates.metadata = newMeta
  }

  const { data: updated, error: updateError } = await (db as any)
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id, full_name, phone_number, avatar_url, role, is_expert, is_verified, metadata')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  if (body.suspended === true) {
    await revokeAllUserSessions(db, id)
  } else if (body.isExpert === false && existing.is_expert === true) {
    await revokeAllUserSessions(db, id)
  } else if (body.role === 'parent' && existing.role === 'admin') {
    await revokeAllUserSessions(db, id)
  }

  await writeAuditLog({
    adminId: auth.admin.id,
    action: 'admin_user_update',
    entityType: 'profile',
    entityId: id,
    oldValues: {
      full_name: existing.full_name,
      phone_number: existing.phone_number,
      avatar_url: existing.avatar_url,
      role: existing.role,
      is_verified: existing.is_verified,
      metadata: oldMeta,
    },
    newValues: {
      full_name: updated.full_name,
      phone_number: updated.phone_number,
      avatar_url: updated.avatar_url,
      role: updated.role,
      is_verified: updated.is_verified,
      metadata: updated.metadata,
    },
  })

  return NextResponse.json({ ok: true, user: updated })
}

export async function DELETE(_request: NextRequest, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  if (id === auth.admin.id) {
    return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 })
  }

  const db = getAdminDb()

  const { data: existing, error: fetchError } = await (db as any)
    .from('profiles')
    .select('id, full_name, role, metadata')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { error: deleteError } = await db.auth.admin.deleteUser(id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  await writeAuditLog({
    adminId: auth.admin.id,
    action: 'admin_user_delete',
    entityType: 'profile',
    entityId: id,
    oldValues: {
      full_name: existing.full_name,
      role: existing.role,
      metadata: existing.metadata,
    },
    newValues: null,
  })

  return NextResponse.json({ ok: true })
}
