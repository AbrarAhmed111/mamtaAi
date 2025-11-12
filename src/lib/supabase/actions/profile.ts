'use server';

import { supabase } from '../client';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type Baby = Database['public']['Tables']['babies']['Row'];
type BabyInsert = Database['public']['Tables']['babies']['Insert'];
type BabyUpdate = Database['public']['Tables']['babies']['Update'];

export interface BabyData {
  name: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  birthWeight?: number;
  birthHeight?: number;
  bloodType?: string;
  medicalNotes?: string;
  avatar?: File;
}

export interface ProfileData {
  fullName: string;
  phone?: string;
  avatar?: File;
  timezone?: string;
  languagePreference?: string;
}

// Get user profile
export async function getUserProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile, error: null };
  } catch (error) {
    console.error('Get profile error:', error);
    return { profile: null, error: 'Failed to fetch profile' };
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string, 
  data: ProfileData
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const updateData: ProfileUpdate = {
      full_name: data.fullName,
      phone_number: data.phone,
      timezone: data.timezone,
      updated_at: new Date().toISOString()
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { profile: null, error: 'Failed to update profile' };
  }
}

// Complete onboarding
export async function completeOnboarding(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Complete onboarding error:', error);
    return { success: false, error: 'Failed to complete onboarding' };
  }
}

// Get user's babies
export async function getUserBabies(userId: string): Promise<{ babies: Baby[]; error: string | null }> {
  try {
    const { data: babies, error } = await supabase
      .from('baby_parents')
      .select(`
        babies (
          id,
          name,
          gender,
          birth_date,
          birth_weight_kg,
          birth_height_cm,
          blood_type,
          avatar_url,
          medical_notes,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('parent_id', userId)
      .eq('babies.is_active', true);

    if (error) {
      return { babies: [], error: error.message };
    }

    const babyList = babies?.map(item => item.babies).filter(Boolean) as Baby[] || [];
    return { babies: babyList, error: null };
  } catch (error) {
    console.error('Get user babies error:', error);
    return { babies: [], error: 'Failed to fetch babies' };
  }
}

// Add baby
export async function addBaby(
  userId: string, 
  babyData: BabyData
): Promise<{ baby: Baby | null; error: string | null }> {
  try {
    // Create baby record
    const babyInsert: BabyInsert = {
      name: babyData.name,
      gender: babyData.gender,
      birth_date: babyData.birthDate,
      birth_weight_kg: babyData.birthWeight,
      birth_height_cm: babyData.birthHeight,
      blood_type: babyData.bloodType,
      medical_notes: babyData.medicalNotes,
      is_active: true
    };

    const { data: baby, error: babyError } = await supabase
      .from('babies')
      .insert(babyInsert)
      .select()
      .single();

    if (babyError) {
      return { baby: null, error: babyError.message };
    }

    // Create baby-parent relationship
    const { error: relationshipError } = await supabase
      .from('baby_parents')
      .insert({
        baby_id: baby.id,
        parent_id: userId,
        relationship: 'guardian',
        is_primary: true,
        access_level: 'full',
        can_edit_profile: true,
        can_record_audio: true,
        can_view_history: true,
        invitation_status: 'accepted'
      });

    if (relationshipError) {
      // Clean up baby record if relationship creation fails
      await supabase.from('babies').delete().eq('id', baby.id);
      return { baby: null, error: relationshipError.message };
    }

    return { baby, error: null };
  } catch (error) {
    console.error('Add baby error:', error);
    return { baby: null, error: 'Failed to add baby' };
  }
}

// Update baby
export async function updateBaby(
  babyId: string, 
  updates: Partial<BabyUpdate>
): Promise<{ baby: Baby | null; error: string | null }> {
  try {
    const { data: baby, error } = await supabase
      .from('babies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', babyId)
      .select()
      .single();

    if (error) {
      return { baby: null, error: error.message };
    }

    return { baby, error: null };
  } catch (error) {
    console.error('Update baby error:', error);
    return { baby: null, error: 'Failed to update baby' };
  }
}

// Delete baby (soft delete)
export async function deleteBaby(babyId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('babies')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', babyId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Delete baby error:', error);
    return { success: false, error: 'Failed to delete baby' };
  }
}

// Get expert verification status
export async function getExpertVerificationStatus(userId: string): Promise<{ 
  isVerified: boolean; 
  verificationData: any; 
  error: string | null 
}> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_verified, verification_data, role')
      .eq('id', userId)
      .single();

    if (error) {
      return { isVerified: false, verificationData: null, error: error.message };
    }

    return { 
      isVerified: profile.is_verified || false, 
      verificationData: profile.verification_data,
      error: null 
    };
  } catch (error) {
    console.error('Get verification status error:', error);
    return { isVerified: false, verificationData: null, error: 'Failed to get verification status' };
  }
}

// Update expert verification documents
export async function updateExpertVerification(
  userId: string, 
  verificationData: any
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_data: verificationData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Update verification error:', error);
    return { success: false, error: 'Failed to update verification data' };
  }
}
