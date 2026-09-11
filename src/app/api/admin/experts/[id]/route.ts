import { NextRequest, NextResponse } from 'next/server'

import { requireAdminApi, getAdminDb, writeAuditLog } from '@/lib/admin'

import { reapplyCooldownEndsAt, verificationDataFromApplication } from '@/lib/expert/applications'

import {
  notifyUserExpertApplicationApproved,
  notifyUserExpertApplicationRejected,
} from '@/lib/notifications/expert-application-notifications'

import { markExpertReviewNotificationsReadForApplicant } from '@/lib/notifications/sticky-expert-notifications'

export const dynamic = 'force-dynamic'

type RouteCtx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')
  const rejectionReason = body.rejectionReason
    ? String(body.rejectionReason).trim().slice(0, 500)
    : null
  const applicationId = body.applicationId ? String(body.applicationId) : null

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const db = getAdminDb()

  const { data: profile, error: fetchError } = await (db as any)
    .from('profiles')
    .select('id, role, is_expert, is_verified, full_name, verification_data')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let application: Record<string, unknown> | null = null
  if (applicationId) {
    const { data } = await (db as any)
      .from('expert_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', id)
      .maybeSingle()
    application = data
  } else {
    const { data } = await (db as any)
      .from('expert_applications')
      .select('*')
      .eq('user_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    application = data
  }

  const now = new Date().toISOString()

  if (action === 'approve') {
    const verificationData = application
      ? verificationDataFromApplication(application as never)
      : {
          ...(profile.verification_data as Record<string, unknown> | null),
          approvedAt: now,
        }

    const { data: updated, error: updateError } = await (db as any)
      .from('profiles')
      .update({
        role: 'parent',
        is_expert: true,
        is_verified: true,
        active_view: 'expert',
        verification_data: verificationData,
        updated_at: now,
      })
      .eq('id', id)
      .select('id, role, is_expert, is_verified, full_name, active_view')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (application?.id) {
      await (db as any)
        .from('expert_applications')
        .update({
          status: 'approved',
          reviewed_by: auth.admin.id,
          reviewed_at: now,
          updated_at: now,
        })
        .eq('id', application.id)
    }

    await writeAuditLog({
      adminId: auth.admin.id,
      action: 'expert_approved',
      entityType: 'profile',
      entityId: id,
      oldValues: { is_expert: profile.is_expert, role: profile.role },
      newValues: { is_expert: true, role: 'parent', active_view: 'expert' },
      metadata: { expertName: profile.full_name, applicationId: application?.id ?? null },
    })

    void notifyUserExpertApplicationApproved(id)
    void markExpertReviewNotificationsReadForApplicant(id)

    return NextResponse.json({ ok: true, expert: updated })
  }

  const canReapplyAfter = reapplyCooldownEndsAt()

  if (application?.id) {
    await (db as any)
      .from('expert_applications')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        can_reapply_after: canReapplyAfter,
        reviewed_by: auth.admin.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq('id', application.id)
  }

  const profileUpdates: Record<string, unknown> = {
    updated_at: now,
  }
  if (profile.role === 'expert' && !profile.is_verified) {
    profileUpdates.role = 'parent'
    profileUpdates.is_expert = false
    profileUpdates.is_verified = true
    profileUpdates.active_view = 'parent'
  }

  const { data: updated, error: updateError } = await (db as any)
    .from('profiles')
    .update(profileUpdates)
    .eq('id', id)
    .select('id, role, is_expert, is_verified, full_name')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await writeAuditLog({
    adminId: auth.admin.id,
    action: 'expert_rejected',
    entityType: 'profile',
    entityId: id,
    oldValues: { is_expert: profile.is_expert, role: profile.role },
    newValues: { is_expert: updated.is_expert, role: updated.role },
    metadata: {
      expertName: profile.full_name,
      applicationId: application?.id ?? null,
      rejectionReason,
      canReapplyAfter,
    },
  })

  void notifyUserExpertApplicationRejected(id, rejectionReason, canReapplyAfter)
  void markExpertReviewNotificationsReadForApplicant(id)

  return NextResponse.json({ ok: true, expert: updated, canReapplyAfter })
}
