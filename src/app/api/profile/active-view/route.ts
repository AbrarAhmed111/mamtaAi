import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  isAdminAccount,
  isVerifiedExpert,
} from '@/lib/expert/active-view'
import type { ActiveViewPreference, AdminDashboardView } from '@/lib/expert/constants'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
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
    const dashboardView = (body.dashboard_view ?? body.dashboardView) as string | undefined
    const activeView = (body.active_view ?? body.activeView) as string | undefined

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_expert, is_verified, metadata')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const baseMeta =
      profile.metadata && typeof profile.metadata === 'object' && !Array.isArray(profile.metadata)
        ? { ...(profile.metadata as Record<string, unknown>) }
        : {}

    if (isAdminAccount(profile)) {
      const adminView = dashboardView as AdminDashboardView | undefined
      const expertView = activeView as ActiveViewPreference | undefined

      if (adminView === undefined && expertView === undefined) {
        return NextResponse.json(
          { error: 'dashboard_view or active_view is required for admin accounts' },
          { status: 400 },
        )
      }

      if (adminView !== undefined) {
        if (adminView !== 'admin' && adminView !== 'parent') {
          return NextResponse.json(
            { error: 'dashboard_view must be admin or parent for admin accounts' },
            { status: 400 },
          )
        }
        baseMeta.admin_dashboard_view = adminView
      }

      if (expertView !== undefined) {
        if (expertView !== 'parent' && expertView !== 'expert') {
          return NextResponse.json(
            { error: 'active_view must be parent or expert' },
            { status: 400 },
          )
        }
        if (!isVerifiedExpert(profile) && expertView !== 'parent') {
          return NextResponse.json(
            { error: 'Only verified experts can switch to expert view' },
            { status: 403 },
          )
        }
        baseMeta.active_view = expertView
      }

      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          metadata: baseMeta as never,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, profile: updated, dashboard_view: view })
    }

    const view = activeView as ActiveViewPreference | undefined
    if (view !== 'parent' && view !== 'expert') {
      return NextResponse.json({ error: 'active_view must be parent or expert' }, { status: 400 })
    }

    if (!isVerifiedExpert(profile)) {
      if (view !== 'parent') {
        return NextResponse.json(
          { error: 'Only verified experts can switch to expert view' },
          { status: 403 },
        )
      }

      baseMeta.active_view = 'parent'

      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          active_view: 'parent',
          metadata: baseMeta as never,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', user.id)
        .select('*')
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, profile: updated, active_view: 'parent' })
    }

    baseMeta.active_view = view

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        active_view: view,
        metadata: baseMeta as never,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', user.id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, profile: updated, active_view: view })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update view' },
      { status: 500 },
    )
  }
}
