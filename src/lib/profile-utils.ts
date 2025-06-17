import { createClient } from "@/lib/supabase/server";

export interface UserProfile {
  id: string;
  email: string | null;
  points: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create a user profile
 * This function ensures that a profile exists for the user and returns it
 */
export async function getOrCreateProfile(
  userId: string,
  email?: string
): Promise<UserProfile | null> {
  const supabase = await createClient();

  try {
    // Try to fetch existing profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return null;
    }

    if (profile) {
      return profile;
    }

    // Profile doesn't exist, create it
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert([
        {
          id: userId,
          email: email || null,
          points: 0,
        },
      ])
      .select("*")
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      return null;
    }

    return newProfile;
  } catch (error) {
    console.error("Unexpected error in getOrCreateProfile:", error);
    return null;
  }
}

/**
 * Update user points
 * This function safely updates a user's points balance
 */
export async function updateUserPoints(
  userId: string,
  pointsDelta: number
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Get current profile
    const profile = await getOrCreateProfile(userId);
    if (!profile) return false;

    const newPoints = Math.max(0, profile.points + pointsDelta); // Ensure points don't go negative

    const { error } = await supabase
      .from("profiles")
      .update({
        points: newPoints,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating points:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in updateUserPoints:", error);
    return false;
  }
}
