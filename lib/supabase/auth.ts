import { supabase } from './client';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
  field: string | null;
  branch: string | null;
  created_at: string;
  updated_at: string;
}

export const signInWithEmail = async (email: string, password: string) => {
  console.log('🔑 Auth: Signing in with email:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  console.log('🔑 Auth: Sign in result:', { user: data.user?.email, error: error?.message });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string) => {
  console.log('📝 Auth: Signing up with email:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  });
  console.log('📝 Auth: Sign up result:', { user: data.user?.email, error: error?.message });
  return { data, error };
};

export const signInWithGoogle = async () => {
  console.log('🔑 Auth: Signing in with Google');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  });
  console.log('🔑 Auth: Google sign in result:', { error: error?.message });
  return { data, error };
};

export const signInWithGitHub = async () => {
  console.log('🔑 Auth: Signing in with GitHub');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  });
  console.log('🔑 Auth: GitHub sign in result:', { error: error?.message });
  return { data, error };
};

export const signOut = async () => {
  console.log('🚪 Auth: Signing out');
  const { error } = await supabase.auth.signOut();
  console.log('🚪 Auth: Sign out result:', { error: error?.message });
  return { error };
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('👤 Auth: Current user:', user?.email || 'None');
  return user;
};

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  console.log('📋 Auth: Fetching profile for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully
    
    if (error) {
      console.error('❌ Auth: Error fetching profile:', error);
      return null;
    }
    
    console.log('📋 Auth: Profile result:', data ? 'Found' : 'Not found');
    return data;
  } catch (error) {
    console.error('💥 Auth: Unexpected error fetching profile:', error);
    return null;
  }
};

export const createUserProfile = async (profileData: {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  city: string;
  field: string;
  branch?: string;
}): Promise<Profile | null> => {
  console.log('📝 Auth: Creating profile for user:', profileData.id);
  console.log('📝 Auth: Profile data:', profileData);
  
  try {
    // First, check if profile already exists
    const existingProfile = await getUserProfile(profileData.id);
    
    const profileToSave = {
      id: profileData.id,
      full_name: profileData.full_name,
      age: profileData.age,
      gender: profileData.gender,
      city: profileData.city,
      field: profileData.field,
      branch: profileData.branch || null,
      updated_at: new Date().toISOString()
    };
    
    console.log('💾 Auth: Saving profile data:', profileToSave);
    
    let result;
    if (existingProfile) {
      console.log('📝 Auth: Profile exists, updating...');
      result = await supabase
        .from('profiles')
        .update(profileToSave)
        .eq('id', profileData.id)
        .select()
        .single();
    } else {
      console.log('📝 Auth: Profile doesn\'t exist, inserting...');
      result = await supabase
        .from('profiles')
        .insert([profileToSave])
        .select()
        .single();
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('❌ Auth: Error saving profile:', error);
      console.error('❌ Auth: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }
    
    console.log('✅ Auth: Profile saved successfully:', data);
    return data;
  } catch (error) {
    console.error('💥 Auth: Unexpected error creating profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  console.log('📝 Auth: Updating profile for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Auth: Error updating profile:', error);
      return null;
    }
    
    console.log('✅ Auth: Profile updated successfully');
    return data;
  } catch (error) {
    console.error('💥 Auth: Unexpected error updating profile:', error);
    return null;
  }
};