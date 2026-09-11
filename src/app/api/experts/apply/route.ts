import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import {
  applicationStatusForUser,
  canSubmitExpertApplication,
  type ExpertApplicationRow,
} from '@/lib/expert/applications'
import { notifyAdminsOfExpertApplication } from '@/lib/notifications/admin-notifications'

export const dynamic = 'force-dynamic'

async function getLatestApplication(userId: string): Promise<ExpertApplicationRow | null> {
  const { data } = await (supabaseAdmin as any)
    .from('expert_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as ExpertApplicationRow) ?? null
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_expert, is_verified, full_name, verification_data, created_at, metadata')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const application = await getLatestApplication(user.id)
    const status = applicationStatusForUser(application, profile)
    const eligibility = canSubmitExpertApplication(application, profile)

    const meta =
      profile.metadata && typeof profile.metadata === 'object' && !Array.isArray(profile.metadata)
        ? (profile.metadata as Record<string, unknown>)
        : null
    const hasExpertIntent = meta?.expert_application_intent === true

    let applicationPayload = application
      ? {
          id: application.id,
          specialization: application.specialization,
          professionalTitle: application.professional_title,
          licenseNumber: application.license_number,
          yearsExperience: application.years_experience,
          bio: application.bio,
          documentUrl: application.document_url,
          documentName: application.document_name,
          status: application.status,
          rejectionReason: application.rejection_reason,
          canReapplyAfter: application.can_reapply_after,
          createdAt: application.created_at,
          reviewedAt: application.reviewed_at,
        }
      : null

    if (!applicationPayload && status === 'pending') {
      const vd = (profile.verification_data || {}) as Record<string, unknown>
      applicationPayload = {
        id: 'legacy',
        specialization: String(vd.specialization ?? 'General practice'),
        professionalTitle: String(vd.professionalTitle ?? 'Expert applicant'),
        licenseNumber: String(vd.licenseNumber ?? ''),
        yearsExperience: Number(vd.yearsOfExperience ?? 0) || 0,
        bio: null,
        documentUrl: String(vd.documentUrl ?? ''),
        documentName: null,
        status: 'pending' as const,
        rejectionReason: null,
        canReapplyAfter: null,
        createdAt: profile.created_at ?? new Date().toISOString(),
        reviewedAt: null,
      }
    }

    return NextResponse.json({
      status,
      hasExpertIntent,
      application: applicationPayload,
      canApply: eligibility.ok,
      applyBlockedReason: eligibility.reason ?? null,
      reapplyAt: eligibility.reapplyAt ?? application?.can_reapply_after ?? null,
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load application' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const specialization = String(body.specialization || '').trim()
    const professionalTitle = String(body.professionalTitle || body.professional_title || '').trim()
    const licenseNumber = String(body.licenseNumber || body.license_number || '').trim()
    const yearsExperience = Number(body.yearsExperience ?? body.years_experience)
    const bio = body.bio ? String(body.bio).trim().slice(0, 2000) : null
    const documentUrl = String(body.documentUrl || body.document_url || '').trim()
    const documentName = body.documentName
      ? String(body.documentName).trim().slice(0, 255)
      : null

    if (!specialization || !professionalTitle || !licenseNumber) {
      return NextResponse.json({ error: 'Specialization, title, and license are required' }, { status: 400 })
    }
    if (!Number.isFinite(yearsExperience) || yearsExperience < 0 || yearsExperience > 80) {
      return NextResponse.json({ error: 'Valid years of experience required' }, { status: 400 })
    }
    if (!documentUrl) {
      return NextResponse.json({ error: 'Verification document is required' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, is_expert, is_verified, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const latest = await getLatestApplication(user.id)
    const eligibility = canSubmitExpertApplication(latest, profile)
    if (!eligibility.ok) {
      return NextResponse.json({ error: eligibility.reason, reapplyAt: eligibility.reapplyAt }, { status: 400 })
    }

    const { data: inserted, error: insertError } = await (supabaseAdmin as any)
      .from('expert_applications')
      .insert({
        user_id: user.id,
        specialization,
        professional_title: professionalTitle,
        license_number: licenseNumber,
        years_experience: Math.round(yearsExperience),
        bio,
        document_url: documentUrl,
        document_name: documentName,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    notifyAdminsOfExpertApplication({
      userId: user.id,
      fullName: profile.full_name,
      professionalTitle,
      applicationId: inserted.id,
    })

    return NextResponse.json({ ok: true, applicationId: inserted.id, status: 'pending' }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to submit application' },
      { status: 500 },
    )
  }
}
