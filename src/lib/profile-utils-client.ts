import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  email: string | null
  points: number
  created_at: string
  updated_at: string
}

/**
 * Get or create a user profile (client-side version)
 * This function ensures that a profile exists for the user and returns it
 */
export async function getOrCreateProfileClient(
  userId: string,
  email?: string
): Promise<UserProfile | null> {
  const supabase = createClient()

  try {
    // Try to fetch existing profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return null
    }

    if (profile) {
      return profile
    }

    // Profile doesn't exist, use upsert to create it safely
    const { data: newProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: email || null,
          points: 0,
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      )
      .select('*')
      .single()

    if (upsertError) {
      console.error('Error upserting profile:', upsertError)
      return null
    }

    return newProfile
  } catch (error) {
    console.error('Unexpected error in getOrCreateProfileClient:', error)
    return null
  }
}
