-- =====================================================
-- Add Missing Profile Columns
-- =====================================================
-- This migration adds the missing columns that the app expects
-- in the profiles table

-- Add missing columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0;

-- Migrate existing points data to points_balance if needed
UPDATE profiles 
SET points_balance = COALESCE(points, 0) 
WHERE points_balance = 0 AND points IS NOT NULL;

-- Update the handle_new_user function to use correct column names
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the attempt (visible in Supabase logs)
  RAISE LOG 'Attempting to create profile for user: %', NEW.id;
  
  -- Insert with current table structure
  INSERT INTO profiles (
    id, 
    email, 
    full_name,
    avatar_url,
    points,
    points_balance,
    privacy_settings,
    content_preferences,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    100, -- Legacy points column
    100, -- New points_balance column
    jsonb_build_object(
      'show_email', false,
      'show_purchase_history', false,
      'allow_friend_requests', true,
      'discrete_billing', true,
      'anonymous_reviews', false
    ),
    jsonb_build_object(
      'blocked_categories', '[]'::jsonb,
      'content_warnings_enabled', true,
      'blur_explicit_content', true
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  
  RAISE LOG 'Successfully created/updated profile for user: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- Don't fail the user creation, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Show completion status
SELECT 
  'Profile columns added successfully! 🎉' as status,
  'Added: full_name, avatar_url, points_balance' as message;
