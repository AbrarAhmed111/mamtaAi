'use server'

import { redirect } from 'next/navigation'
import { signInWithEmail, signUpWithEmail, resetPassword, type SignupData } from '@/lib/supabase/actions'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function checkEmailAndRedirect(email: string): Promise<{ status: 'signin' | 'signup'; error?: string }> {
  try {
    // Try to find user by email using admin client
    const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    if (error && !error.message?.includes('not found')) {
      return { status: 'signin', error: 'Unable to verify email at the moment' }
    }
    return { status: data?.user ? 'signin' : 'signup' }
  } catch {
    return { status: 'signin', error: 'Unable to verify email at the moment' }
  }
}

export async function signin(formData: FormData, returnUrl?: string): Promise<{ error?: string }> {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const { user, error } = await signInWithEmail({ email, password })
  if (error) return { error: error.message }

  // On success, redirect to returnUrl or dashboard
  redirect(returnUrl || '/dashboard')
}

export async function signup(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const firstName = String(formData.get('first-name') || '')
  const lastName = String(formData.get('last-name') || '')
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const payload: SignupData = {
    email,
    password,
    firstName,
    lastName,
    role: 'parent',
  }

  const { user, error } = await signUpWithEmail(payload)
  if (error) return { error: error.message }
  if (!user) return { error: 'Failed to create account' }
  return { success: true }
}

export async function forgotPassword(email: string): Promise<{ success?: string; error?: string }> {
  const { error } = await resetPassword(email)
  if (error) return { error: error.message }
  return { success: 'Password reset email sent successfully.' }
}

// Optional: implement server-side password update if needed later
export async function updatePasswordAction(_password: string): Promise<void> {
  // For now, redirect user to dashboard; client flow validates session and can handle update if implemented
  redirect('/dashboard')
}


