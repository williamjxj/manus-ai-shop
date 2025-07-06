# 🎯 AI Shop Features

## 🔐 Authentication

### Supported Methods
- **Email/Password**: Traditional signup/login
- **Social Login**: Google, GitHub OAuth
- **Session Management**: Persistent sessions with Supabase Auth

### Implementation
- Protected routes with middleware
- User profiles with points balance
- Automatic profile creation on signup

### Pages
- `/login` - User login
- `/signup` - User registration
- `/auth/callback` - OAuth callback handler

---

## 🛒 Shopping Experience

### Product Gallery (`/products`)
- Browse AI-generated images
- Category filtering
- Add to cart functionality
- Real-time cart updates

### Shopping Cart (`/cart`)
- View cart items with quantities
- Update quantities or remove items
- Real-time total calculations
- Persistent cart storage in database

### Checkout Process (`/checkout`)
- Dual payment options:
  - **Stripe**: Credit card payments
  - **Points**: Use purchased points
- Order confirmation
- Success page with order details

---

## 💳 Payment System

### Stripe Integration
- Secure checkout sessions
- Webhook handling for confirmations
- Support for multiple payment methods
- Automatic order fulfillment

### Points System (`/points`)
- **Purchase Points**: Buy points packages with Stripe
- **Spend Points**: Use points for product purchases
- **Transaction History**: Track all points activity
- **Balance Management**: Real-time balance updates

### Points Packages
- **Basic**: 100 points - $0.99
- **Premium**: 550 points - $3.99
- **Pro**: 1200 points - $7.99

---

## 📤 Upload Feature (`/upload`)

### For Authenticated Users
- Upload AI-generated images
- Set product details (name, description)
- Configure pricing (both USD and points)
- Automatic product creation
- Image storage in Supabase Storage

### Requirements
- User must be logged in
- Supported formats: JPG, PNG, WebP
- Maximum file size: 10MB
- Images stored in `products` bucket

---

## 🗄 Database Schema

### Core Tables
- **`profiles`**: User accounts & points balance
- **`products`**: AI-generated images for sale
- **`cart_items`**: Shopping cart contents
- **`orders`**: Purchase records
- **`order_items`**: Individual order items
- **`points_transactions`**: Points purchase/spend history
- **`webhook_events`**: Stripe webhook tracking

### Security
- Row Level Security (RLS) policies
- User data isolation
- Protected API routes

---

## 🔧 API Routes

### Checkout
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/checkout/points` - Process points-based purchase

### Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe events

### Debug/Testing
- `GET /api/debug/webhook-status` - Check webhook configuration
- `POST /api/test/webhook` - Test webhook endpoint
- `GET /api/test-local-db` - Test database connection

---

## 📱 User Interface

### Design System
- **Framework**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Responsive**: Mobile-first design

### Key Components
- `Navbar` - Navigation with cart count
- `ProductCard` - Product display component
- `CartContext` - Global cart state management
- Authentication forms with social login buttons

---

## 🔒 Security Features

### Data Protection
- Environment variable protection
- Secure API key management
- Webhook signature verification
- Input validation and sanitization

### Access Control
- Protected routes middleware
- User-specific data access
- Admin-only upload functionality
- Secure payment processing

---

## 🚀 Performance

### Optimization
- Server-side rendering with Next.js
- Real-time updates with Supabase
- Efficient cart state management
- Optimized image loading

### Caching
- Static asset caching
- Database query optimization
- Session persistence
