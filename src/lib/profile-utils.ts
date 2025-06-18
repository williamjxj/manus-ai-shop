import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  email: string | null
  points: number
  created_at: string
  updated_at: string
}

/**
 * Get or create a user profile
 * This function ensures that a profile exists for the user and returns it
 */
export async function getOrCreateProfile(
  userId: string,
  email?: string
): Promise<UserProfile | null> {
  const supabase = await createClient()

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
    console.error('Unexpected error in getOrCreateProfile:', error)
    return null
  }
}

/**
 * Update user points with enhanced safety and logging
 * This function safely updates a user's points balance with race condition protection
 */
export async function updateUserPoints(
  userId: string,
  pointsDelta: number,
  description?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const supabase = await createClient()

  try {
    // Input validation
    if (!userId || typeof pointsDelta !== 'number') {
      return { success: false, error: 'Invalid input parameters' }
    }

    // Use atomic update with RPC to prevent race conditions
    const { data, error } = await supabase.rpc('update_user_points_atomic', {
      p_user_id: userId,
      p_points_delta: pointsDelta,
      p_description:
        description ||
        `Points ${pointsDelta > 0 ? 'added' : 'deducted'}: ${Math.abs(
          pointsDelta
        )}`,
    })

    if (error) {
      console.error('Error updating points:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      newBalance: data?.new_balance || 0,
    }
  } catch (error) {
    console.error('Unexpected error in updateUserPoints:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get user points balance with caching
 */
export async function getUserPointsBalance(
  userId: string
): Promise<number | null> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching points balance:', error)
      return null
    }

    return data?.points || 0
  } catch (error) {
    console.error('Unexpected error in getUserPointsBalance:', error)
    return null
  }
}

/**
 * Validate sufficient points for a transaction
 */
export async function validateSufficientPoints(
  userId: string,
  requiredPoints: number
): Promise<{ valid: boolean; currentBalance: number; error?: string }> {
  const currentBalance = await getUserPointsBalance(userId)

  if (currentBalance === null) {
    return {
      valid: false,
      currentBalance: 0,
      error: 'Unable to fetch points balance',
    }
  }

  return {
    valid: currentBalance >= requiredPoints,
    currentBalance,
    error: currentBalance < requiredPoints ? 'Insufficient points' : undefined,
  }
}
