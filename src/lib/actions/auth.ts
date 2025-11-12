'use server'

import { redirect } from 'next/navigation'
import { signInWithEmail, signUpWithEmail, resetPassword, resendSignupConfirmation, type SignupData } from '@/lib/supabase/actions'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function checkEmailAndRedirect(email: string): Promise<{ status: 'signin' | 'signup'; error?: string }> {
  try {
    // Best-effort existence check using admin listUsers
    const { data, error } = await (supabaseAdmin as any).auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error || !Array.isArray(data?.users)) {
      // Be conservative: if we can't verify, default to signup to avoid false positives
      return { status: 'signup' }
    }
    const target = email.trim().toLowerCase()
    const exists = data.users.some((u: any) => (u.email || '').toLowerCase() === target)
    return { status: exists ? 'signin' : 'signup' }
  } catch {
    return { status: 'signup' }
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
  const role = String(formData.get('role') || 'parent') as 'parent' | 'expert' | 'admin'
  const professionalTitle = String(formData.get('professional-title') || '')
  const licenseNumber = String(formData.get('license-number') || '')
  const yearsOfExperience = String(formData.get('years-of-experience') || '')
  const documents = formData.getAll('documents').filter(Boolean) as File[]

  const payload: SignupData = {
    email,
    password,
    firstName,
    lastName,
    role,
    professionalTitle: role === 'expert' ? professionalTitle || undefined : undefined,
    licenseNumber: role === 'expert' ? licenseNumber || undefined : undefined,
    yearsOfExperience: role === 'expert' ? yearsOfExperience || undefined : undefined,
    verificationDocuments: role === 'expert' ? documents : undefined,
  }

  const { user, error } = await signUpWithEmail(payload)
  if (error) {
    // If auth user was created but profile failed, still guide user to verify email
    if (error.message.toLowerCase().includes('create user profile')) {
      return { success: true }
    }
    return { error: error.message }
  }
  if (!user) return { error: 'Failed to create account' }
  return { success: true }
}

export async function forgotPassword(email: string): Promise<{ success?: string; error?: string }> {
  const { error } = await resetPassword(email)
  if (error) return { error: error.message }
  return { success: 'Password reset email sent successfully.' }
}

export async function resendConfirmation(email: string): Promise<{ success?: string; error?: string }> {
  const { error } = await resendSignupConfirmation(email)
  if (error) return { error: error.message }
  return { success: 'Confirmation email resent. Please check your inbox.' }
}

export async function updatePasswordAction(newPassword: string): Promise<void> {
  const supabase = await createServerClient()
  // Ensure we are in a valid recovery/auth session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Invalid or expired session. Please request a new password reset.')
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    throw new Error(error.message || 'Failed to update password.')
  }

  // Success - redirect to dashboard (or sign-in) as desired
  redirect('/dashboard?passwordReset=success')
}


