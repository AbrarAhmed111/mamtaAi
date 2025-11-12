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
      return NextResponse.json({ hasBaby: false, hasRecording: false, hasCommunity: false })
    }

    // Babies
    const { data: babyRows, error: babyErr } = await supabase
      .from('baby_parents')
      .select('baby_id', { count: 'exact', head: true })
      .eq('parent_id', user.id)
    const hasBaby = !babyErr && ((babyRows as any)?.length !== 0 || (babyRows as any) === null) ? (babyErr ? false : (true)) : true
    // When using head:true, data may be null; better use count via rpc-like
    const { count: babiesCount } = await supabase
      .from('baby_parents')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', user.id)
    const hasBabyFinal = (babiesCount || 0) > 0

    // Recordings
    const { count: recCount } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })
      .eq('recorded_by', user.id)
    const hasRecording = (recCount || 0) > 0

    // Community: either forum_threads or forum_replies authored by user
    const { count: threadsCount } = await supabase
      .from('forum_threads')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)
    const { count: repliesCount } = await supabase
      .from('forum_replies')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id)
    const hasCommunity = (threadsCount || 0) + (repliesCount || 0) > 0

    return NextResponse.json({
      hasBaby: hasBabyFinal,
      hasRecording,
      hasCommunity,
    })
  } catch (e: any) {
    return NextResponse.json(
      { hasBaby: false, hasRecording: false, hasCommunity: false, error: e?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}


