import { createServerClient } from './server'
import type { AuthUser } from './actions'

export async function getServerAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) return null

    return {
      id: user.id,
      email: user.email ?? '',
      profile,
    }
  } catch {
    return null
  }
}
