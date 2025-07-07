# 🎯 Demo Setup Guide - Adult AI Gallery

## Quick Start Testing

### 1. **Test User Account**

**Option A: Create New User**

1. Go to `http://localhost:3001/signup`
2. Use these credentials:
   - **Email:** `demo@test.com`
   - **Password:** `DemoUser123!`
3. Complete age verification (check "I am 18+")
4. Accept terms and privacy policy
5. Sign up and verify email if required

**Option B: Use Existing Account**

- Check your Supabase dashboard for existing users
- Or use any email you prefer for testing

### 2. **Testing the Upload System**

**Single File Upload:**

1. Go to `/upload`
2. Click "Choose File" or drag & drop
3. Select an image or video file
4. Fill in product details:
   - **Name:** "Test Adult Content"
   - **Description:** "Demo product for testing"
   - **Price:** $9.99 (999 cents)
   - **Points:** 50
   - **Category:** Select any adult category
5. **Content Warnings:** Check appropriate warnings
6. **Tags:** Add tags like "demo, test, premium"
7. **Explicit Content:** Check the 18+ checkbox
8. Click "Upload Product"

**Multiple File Upload:**

1. Select multiple files at once (Ctrl/Cmd + click)
2. First file becomes main product image
3. Additional files are stored as supplementary content
4. Each file gets individual processing

### 3. **Testing Product Features**

**Browse Products:**

1. Go to `/products`
2. View age verification modal
3. Browse demo products
4. Test filtering and search
5. Add items to cart

**Product Details:**

1. Click on any product
2. View content warnings
3. Test review system
4. Check media gallery

**Shopping Cart:**

1. Add products to cart
2. View cart summary
3. Test checkout process
4. Use Stripe test cards

### 4. **Admin Features Testing**

**Content Moderation:**

1. Go to `/admin/moderation`
2. Review uploaded content
3. Approve/reject products
4. Add moderation notes

**User Management:**

1. Check user profiles
2. Verify age verification status
3. Monitor user activity

### 5. **Demo Products Available**

Since the database seeding didn't complete, you can create these demo products manually:

**Product 1: "Artistic Nude Collection"**

- Category: Artistic Nude
- Price: $29.99
- Content Warnings: Nudity, Artistic
- Description: "High-quality artistic nude photography collection"

**Product 2: "Sensual Video Series"**

- Category: Sensual
- Price: $49.99
- Content Warnings: Sexual Content, Nudity
- Description: "Premium 4K sensual video content"

**Product 3: "Boudoir Photography"**

- Category: Boudoir
- Price: $19.99
- Content Warnings: Sensual, Nudity
- Description: "Elegant boudoir photography collection"

### 6. **Test Scenarios**

**Age Verification Flow:**

1. Visit site as new user
2. Verify age gate appears
3. Test age verification process
4. Confirm content access

**Purchase Flow:**

1. Browse products
2. Add to cart
3. Proceed to checkout
4. Test Stripe payment (use test cards)
5. Verify order completion

**Content Upload Flow:**

1. Upload new content
2. Add content warnings
3. Submit for moderation
4. Check moderation dashboard
5. Approve content
6. Verify it appears in products

**Mobile Testing:**

1. Test on mobile device
2. Verify responsive design
3. Test touch interactions
4. Check mobile navigation

### 7. **Stripe Test Cards**

For testing payments, use these Stripe test cards:

**Successful Payment:**

- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Declined Payment:**

- Card: `4000 0000 0000 0002`

**Requires Authentication:**

- Card: `4000 0025 0000 3155`

### 8. **Feature Checklist**

Test these key features:

- [ ] **Age Verification:** 18+ gate working
- [ ] **User Registration:** Sign up process
- [ ] **Content Upload:** Single and multiple files
- [ ] **Content Warnings:** Selection and display
- [ ] **Product Browsing:** Filtering and search
- [ ] **Shopping Cart:** Add/remove items
- [ ] **Checkout:** Stripe payment processing
- [ ] **Reviews:** Rating and commenting
- [ ] **Moderation:** Admin content review
- [ ] **Mobile:** Responsive design
- [ ] **Privacy:** Discrete billing options

### 9. **Common Issues & Solutions**

**Upload Not Working:**

- Check file size limits (15MB images, 200MB videos)
- Verify file formats (JPEG, PNG, WebP, MP4, WebM)
- Ensure content warnings are selected

**Payment Issues:**

- Use Stripe test cards only
- Check webhook configuration
- Verify environment variables

**Age Verification:**

- Clear browser cache/cookies
- Check localStorage for verification status
- Ensure user profile has age_verified = true

**Content Not Appearing:**

- Check moderation status (should be 'approved')
- Verify content warnings are set
- Check category filtering

### 10. **Database Quick Check**

If you need to check the database directly:

```sql
-- Check users
SELECT email, age_verified FROM profiles LIMIT 5;

-- Check products
SELECT name, category, moderation_status FROM products LIMIT 5;

-- Check orders
SELECT id, total_cents, status FROM orders LIMIT 5;
```

---

## 🎉 **Ready to Test!**

Your Adult AI Gallery is now ready for comprehensive testing. Start with user registration, then test the upload system, and finally try the complete purchase flow.

**Development Server:** `http://localhost:3001`

**Key Test Areas:**

1. User authentication and age verification
2. Content upload with multiple files
3. Product browsing and filtering
4. Shopping cart and checkout
5. Content moderation workflow
6. Mobile responsiveness

Happy testing! 🚀
