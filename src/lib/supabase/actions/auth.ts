'use server';

import { supabase, supabaseAdmin } from '../client';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'parent' | 'expert' | 'admin';
  profilePicture?: File;
  verificationDocuments?: File[];
  professionalTitle?: string;
  licenseNumber?: string;
  yearsOfExperience?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Sign up with email and password
export async function signUpWithEmail(data: SignupData): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  try {
    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { user: null, error: { message: authError.message, code: authError.message } };
    }

    if (!authData.user) {
      return { user: null, error: { message: 'Failed to create user account' } };
    }

    // Create user profile
    const profileData: ProfileInsert = {
      id: authData.user.id,
      full_name: `${data.firstName} ${data.lastName}`,
      phone_number: data.phone,
      role: data.role,
      is_verified: data.role === 'parent', // Parents are auto-verified
      verification_data: data.role === 'expert' ? {
        professionalTitle: data.professionalTitle,
        licenseNumber: data.licenseNumber,
        yearsOfExperience: data.yearsOfExperience,
        documents: data.verificationDocuments?.map(doc => doc.name) || []
      } : null,
      onboarding_completed: false,
      metadata: {
        firstName: data.firstName,
        lastName: data.lastName,
        signupMethod: 'email'
      }
    };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { user: null, error: { message: 'Failed to create user profile', code: profileError.code } };
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        profile: profile
      },
      error: null
    };

  } catch (error) {
    console.error('Signup error:', error);
    return { 
      user: null, 
      error: { message: 'An unexpected error occurred during signup' } 
    };
  }
}

// Sign in with email and password
export async function signInWithEmail(data: LoginData): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { user: null, error: { message: authError.message, code: authError.message } };
    }

    if (!authData.user) {
      return { user: null, error: { message: 'Failed to sign in' } };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return { user: null, error: { message: 'Failed to load user profile', code: profileError.code } };
    }

    // Update last active timestamp (if field exists)
    // Note: last_active_at field may not exist in current schema

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        profile: profile
      },
      error: null
    };

  } catch (error) {
    console.error('Login error:', error);
    return { 
      user: null, 
      error: { message: 'An unexpected error occurred during login' } 
    };
  }
}

// Sign out
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { error: { message: error.message, code: error.message } };
    }

    return { error: null };
  } catch (error) {
    console.error('Signout error:', error);
    return { 
      error: { message: 'An unexpected error occurred during signout' } 
    };
  }
}

// Get current user
export async function getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { user: null, error: authError ? { message: authError.message } : { message: 'No user found' } };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      return { user: null, error: { message: 'Failed to load user profile', code: profileError.code } };
    }

    return {
      user: {
        id: authUser.id,
        email: authUser.email!,
        profile: profile
      },
      error: null
    };

  } catch (error) {
    console.error('Get current user error:', error);
    return { 
      user: null, 
      error: { message: 'An unexpected error occurred' } 
    };
  }
}

// Send password reset email
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      return { error: { message: error.message, code: error.message } };
    }

    return { error: null };
  } catch (error) {
    console.error('Reset password error:', error);
    return { 
      error: { message: 'An unexpected error occurred' } 
    };
  }
}

// Update user profile
export async function updateProfile(
  userId: string, 
  updates: Partial<ProfileUpdate>
): Promise<{ profile: Profile | null; error: AuthError | null }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error: { message: error.message, code: error.code } };
    }

    return { profile, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { 
      profile: null, 
      error: { message: 'An unexpected error occurred' } 
    };
  }
}

// Check if user is verified (for experts)
export async function checkUserVerification(userId: string): Promise<{ isVerified: boolean; error: AuthError | null }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_verified, role')
      .eq('id', userId)
      .single();

    if (error) {
      return { isVerified: false, error: { message: error.message, code: error.code } };
    }

    // Parents are always considered "verified"
    const isVerified = profile.role === 'parent' || (profile.is_verified || false);

    return { isVerified, error: null };
  } catch (error) {
    console.error('Check verification error:', error);
    return { 
      isVerified: false, 
      error: { message: 'An unexpected error occurred' } 
    };
  }
}
