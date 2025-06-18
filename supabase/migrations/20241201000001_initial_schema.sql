-- =====================================================
-- AI Shop - Complete Supabase Database Schema
-- =====================================================
-- This schema includes all tables, functions, triggers, and policies
-- needed for the AI Shop application with proper user authentication

-- Create users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  points_price INTEGER NOT NULL,
  category TEXT DEFAULT 'ai-art',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('stripe', 'points')),
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  points_price INTEGER NOT NULL
);

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for credits, negative for debits
  type TEXT CHECK (type IN ('purchase', 'spend', 'refund')),
  description TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT CHECK (plan IN ('basic', 'premium', 'pro')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Create Row Level Security Policies
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own points transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Cart items policies
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Points transactions policies
CREATE POLICY "Users can view own points transactions" ON points_transactions FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- User Profile Creation Function and Trigger
-- =====================================================

-- Enhanced function to handle user creation with robust error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the attempt (visible in Supabase logs)
  RAISE LOG 'Attempting to create profile for user: %', NEW.id;
  
  -- Insert with detailed error handling
  INSERT INTO profiles (id, email, points, created_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    0,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
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

-- Drop and recreate the trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- Sample Data
-- =====================================================

-- Insert sample products (use ON CONFLICT to avoid duplicates)
INSERT INTO products (name, description, image_url, price_cents, points_price, category) VALUES
('Cosmic Nebula', 'A stunning view of a colorful nebula in deep space with swirling gases and bright stars', '/images/cosmic-nebula.jpg', 999, 50, 'space'),
('Mystical Forest', 'An enchanted forest scene with glowing mushrooms and ethereal lighting', '/images/mystical-forest.jpg', 1299, 65, 'fantasy'),
('Cyberpunk City', 'A futuristic cityscape with neon lights and flying vehicles', '/images/cyberpunk-city.jpg', 1499, 75, 'sci-fi'),
('Ancient Dragon', 'A majestic dragon perched on a mountain peak with detailed scales and wings', '/images/ancient-dragon.jpg', 1799, 90, 'fantasy'),
('Ocean Sunset', 'A serene ocean scene with a beautiful sunset reflecting on the waves', '/images/ocean-sunset.jpg', 899, 45, 'nature'),
('Robot Warrior', 'A powerful robotic warrior in a battle-ready stance with glowing eyes', '/images/robot-warrior.jpg', 1599, 80, 'sci-fi')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Show setup completion status
SELECT 
  'Setup completed successfully! 🎉' as status,
  'All tables, functions, triggers, and policies are ready.' as message;

-- Show table counts
SELECT 
  'products' as table_name,
  COUNT(*) as record_count
FROM products
UNION ALL
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM profiles;
