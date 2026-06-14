import { NextResponse } from 'next/server'

import { requireAdminApi, getAdminDb } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response

  const db = getAdminDb()

  const { data: applicationRows, error: appError } = await (db as any)
    .from('expert_applications')
    .select(
      `
      id,
      user_id,
      specialization,
      professional_title,
      license_number,
      years_experience,
      bio,
      document_url,
      document_name,
      status,
      created_at,
      profile:profiles!expert_applications_user_id_fkey(id, full_name, avatar_url, role, is_expert, is_verified)
    `,
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 })
  }

  const fromApplications = (applicationRows || []).map((row: Record<string, unknown>) => {
    const profile = row.profile as Record<string, unknown> | null
    return {
      id: profile?.id ?? row.user_id,
      applicationId: row.id,
      fullName: profile?.full_name ?? 'Unknown',
      avatarUrl: profile?.avatar_url ?? null,
      createdAt: row.created_at,
      specialization: row.specialization,
      professionalTitle: row.professional_title,
      licenseNumber: row.license_number,
      yearsOfExperience: row.years_experience,
      bio: row.bio,
      documentUrl: row.document_url,
      documentName: row.document_name,
      source: 'application' as const,
    }
  })

  const { data: legacyRows } = await (db as any)
    .from('profiles')
    .select('id, full_name, avatar_url, role, is_expert, is_verified, created_at, verification_data, metadata')
    .eq('role', 'expert')
    .eq('is_verified', false)

  const applicationUserIds = new Set(fromApplications.map((e: { id: string }) => e.id))
  const legacyExperts = (legacyRows || [])
    .filter((row: { id: string }) => !applicationUserIds.has(row.id))
    .map((row: Record<string, unknown>) => {
      const vd = row.verification_data as Record<string, unknown> | null
      return {
        id: row.id,
        applicationId: null,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        specialization: vd?.specialization ?? null,
        professionalTitle: vd?.professionalTitle ?? vd?.title ?? null,
        yearsOfExperience: vd?.yearsOfExperience ?? vd?.years_of_experience ?? null,
        bio: vd?.bio ?? null,
        documentUrl: vd?.documentUrl ?? null,
        documentName: vd?.documentName ?? null,
        licenseNumber: vd?.licenseNumber ?? null,
        source: 'legacy' as const,
      }
    })

  return NextResponse.json({ experts: [...fromApplications, ...legacyExperts] })
}
