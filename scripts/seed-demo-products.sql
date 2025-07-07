-- =====================================================
-- Demo Products for Adult AI Gallery
-- =====================================================
-- Creates sample products with multiple media files for testing

-- Insert demo user (if not exists)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  'demo@adultaigallery.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert demo profile
INSERT INTO profiles (id, email, points, age_verified, age_verified_at, is_content_creator, creator_verified)
VALUES (
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  'demo@adultaigallery.com',
  1000,
  true,
  NOW(),
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Demo Product 1: Premium Artistic Collection
INSERT INTO products (
  id,
  name,
  description,
  image_url,
  media_url,
  media_type,
  price_cents,
  points_price,
  category,
  user_id,
  content_warnings,
  tags,
  is_explicit,
  age_restriction,
  moderation_status,
  created_at
) VALUES (
  'demo-product-1',
  'Ethereal Beauty - Premium AI Art Collection',
  'A stunning collection of 12 high-resolution AI-generated artistic nude images featuring ethereal lighting and professional composition. Each image is crafted with attention to artistic merit while maintaining tasteful sensuality. Perfect for art collectors and enthusiasts of digital beauty.',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1920&h=1080&fit=crop',
  'image',
  2999, -- $29.99
  150,
  'artistic-nude',
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  ARRAY['nudity', 'artistic'],
  ARRAY['artistic', 'premium', 'collection', 'high-resolution', 'ethereal'],
  true,
  18,
  'approved',
  NOW() - INTERVAL '2 days'
);

-- Demo Product 2: Sensual Video Collection
INSERT INTO products (
  id,
  name,
  description,
  image_url,
  media_url,
  media_type,
  price_cents,
  points_price,
  category,
  user_id,
  content_warnings,
  tags,
  is_explicit,
  age_restriction,
  moderation_status,
  thumbnail_url,
  duration_seconds,
  created_at
) VALUES (
  'demo-product-2',
  'Sensual Motion - 4K Video Series',
  'An exclusive 4K video series featuring 5 professionally produced sensual motion pieces. Each video showcases artistic movement and intimate moments captured with cinematic quality. Total runtime: 25 minutes of premium content.',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
  'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
  'video',
  4999, -- $49.99
  250,
  'sensual',
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  ARRAY['sexual-content', 'nudity'],
  ARRAY['4k', 'premium', 'cinematic', 'sensual', 'motion'],
  true,
  18,
  'approved',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  1500, -- 25 minutes
  NOW() - INTERVAL '1 day'
);

-- Demo Product 3: Boudoir Photography Style
INSERT INTO products (
  id,
  name,
  description,
  image_url,
  media_url,
  media_type,
  price_cents,
  points_price,
  category,
  user_id,
  content_warnings,
  tags,
  is_explicit,
  age_restriction,
  moderation_status,
  created_at
) VALUES (
  'demo-product-3',
  'Intimate Moments - Boudoir Collection',
  'A sophisticated boudoir-style collection featuring 8 tastefully composed images that capture intimate and romantic moments. Created with AI precision to showcase elegance and sensuality in a classy, artistic manner.',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&h=1080&fit=crop',
  'image',
  1999, -- $19.99
  100,
  'boudoir',
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  ARRAY['sensual', 'nudity'],
  ARRAY['boudoir', 'intimate', 'romantic', 'elegant', 'classy'],
  true,
  18,
  'approved',
  NOW() - INTERVAL '3 hours'
);

-- Demo Product 4: Fantasy Art Collection
INSERT INTO products (
  id,
  name,
  description,
  image_url,
  media_url,
  media_type,
  price_cents,
  points_price,
  category,
  user_id,
  content_warnings,
  tags,
  is_explicit,
  age_restriction,
  moderation_status,
  created_at
) VALUES (
  'demo-product-4',
  'Mythical Desires - Fantasy Art Series',
  'Enter a world of fantasy with this exclusive collection of 15 AI-generated images featuring mythical beings and fantasy scenarios. Each piece combines artistic excellence with imaginative storytelling, perfect for fantasy art enthusiasts.',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop',
  'image',
  3499, -- $34.99
  175,
  'fantasy',
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  ARRAY['fantasy', 'nudity'],
  ARRAY['fantasy', 'mythical', 'storytelling', 'imaginative', 'exclusive'],
  true,
  18,
  'approved',
  NOW() - INTERVAL '6 hours'
);

-- Demo Product 5: Glamour Photography
INSERT INTO products (
  id,
  name,
  description,
  image_url,
  media_url,
  media_type,
  price_cents,
  points_price,
  category,
  user_id,
  content_warnings,
  tags,
  is_explicit,
  age_restriction,
  moderation_status,
  created_at
) VALUES (
  'demo-product-5',
  'Studio Glamour - Professional Series',
  'A professional glamour photography series featuring 10 studio-quality images with perfect lighting and composition. Each image showcases the beauty of the human form with artistic flair and professional polish.',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1920&h=1080&fit=crop',
  'image',
  2499, -- $24.99
  125,
  'glamour',
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  ARRAY['nudity', 'sensual'],
  ARRAY['glamour', 'studio', 'professional', 'lighting', 'composition'],
  true,
  18,
  'approved',
  NOW() - INTERVAL '12 hours'
);

-- Add some demo reviews
INSERT INTO reviews (
  id,
  product_id,
  user_id,
  rating,
  comment,
  is_anonymous,
  created_at
) VALUES 
(
  gen_random_uuid(),
  'demo-product-1',
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  5,
  'Absolutely stunning collection! The artistic quality is exceptional and the attention to detail is remarkable. Highly recommended for art enthusiasts.',
  false,
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  'demo-product-2',
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  5,
  'The 4K quality is incredible and the cinematography is top-notch. Worth every penny for the premium content.',
  true,
  NOW() - INTERVAL '6 hours'
),
(
  gen_random_uuid(),
  'demo-product-3',
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  4,
  'Beautiful boudoir collection with tasteful composition. The romantic atmosphere is perfectly captured.',
  false,
  NOW() - INTERVAL '3 hours'
);

-- Update product ratings (this would normally be done by triggers)
UPDATE products SET 
  average_rating = 5.0,
  review_count = 1
WHERE id = 'demo-product-1';

UPDATE products SET 
  average_rating = 5.0,
  review_count = 1
WHERE id = 'demo-product-2';

UPDATE products SET 
  average_rating = 4.0,
  review_count = 1
WHERE id = 'demo-product-3';

-- Add some demo media files for multi-media products
INSERT INTO media_files (
  id,
  user_id,
  file_name,
  file_path,
  file_size,
  mime_type,
  media_type,
  bucket_name,
  public_url,
  is_explicit,
  content_warnings,
  age_restriction,
  moderation_status
) VALUES 
(
  gen_random_uuid(),
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  'ethereal_beauty_01.jpg',
  'products/ethereal_beauty_01.jpg',
  2048576,
  'image/jpeg',
  'image',
  'adult-images',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1920&h=1080&fit=crop',
  true,
  ARRAY['nudity', 'artistic'],
  18,
  'approved'
),
(
  gen_random_uuid(),
  'demo-user-123e4567-e89b-12d3-a456-426614174000',
  'ethereal_beauty_02.jpg',
  'products/ethereal_beauty_02.jpg',
  1987654,
  'image/jpeg',
  'image',
  'adult-images',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&h=1080&fit=crop',
  true,
  ARRAY['nudity', 'artistic'],
  18,
  'approved'
);

-- Success message
SELECT 'Demo products created successfully! You can now browse the Adult AI Gallery with sample content.' as message;
