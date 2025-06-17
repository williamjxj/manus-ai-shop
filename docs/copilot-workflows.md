# Purchase Workflows Documentation

This document outlines the complete workflows for purchasing points and images in the AI Shop application, including database operations, webhook handling, and optimization recommendations.

## Table of Contents
- [Points Purchase Workflow](#points-purchase-workflow)
- [Image Purchase Workflow](#image-purchase-workflow)
- [Relationship Between Points and Image Purchases](#relationship-between-points-and-image-purchases)
- [Database Schema Overview](#database-schema-overview)
- [Current Implementation Analysis](#current-implementation-analysis)
- [Optimization Recommendations](#optimization-recommendations)
- [Security Considerations](#security-considerations)

---

## Points Purchase Workflow

### User Journey
1. User visits `/points` page
2. User selects a points package (Basic, Premium, Pro)
3. User clicks "Purchase" button
4. System creates Stripe checkout session
5. User completes payment on Stripe
6. Stripe sends webhook to `/api/webhooks/stripe`
7. System processes webhook and updates database
8. User is redirected to success page

### Technical Flow

```mermaid
graph TD
    A[User visits /points] --> B{Selects Points Package};
    B --> C[Clicks Purchase];
    C --> D[POST /api/checkout/points];
    D --> E[Stripe Checkout Session Created];
    E --> F[User Completes Payment on Stripe];
    F --> G[Stripe Sends Webhook: checkout.session.completed];
    G --> H[POST /api/webhooks/stripe];
    H --> I[Process Webhook: Update DB];
    I --> J[DB: profiles Updated (Points Added)];
    I --> K[DB: points_transactions Inserted];
    H --> L[User Redirected to Success Page];
```

#### Step 1: Checkout Session Creation
**Endpoint**: `POST /api/checkout/points`

**Request Body**:
```json
{
  "packageId": "premium",
  "points": 550,
  "price": 3999
}
```

**Database Operations**: None (session creation only)

#### Step 2: Stripe Payment Processing
- Handled entirely by Stripe
- No direct database operations

#### Step 3: Webhook Processing
**Endpoint**: `POST /api/webhooks/stripe`
**Event Type**: `checkout.session.completed`

**Database Operations**:

| Table | Operation | Purpose |
|-------|-----------|---------|
| `profiles` | INSERT/UPDATE | Create/update user profile with new points balance |
| `points_transactions` | INSERT | Record the points purchase transaction |

**Webhook Payload Processing**:
```javascript
const session = event.data.object
const userId = session.metadata.user_id
const points = parseInt(session.metadata.points)
const paymentIntentId = session.payment_intent
```

---

## Image Purchase Workflow

### User Journey
1. User browses products on `/products` page
2. User adds items to cart
3. User visits `/cart` page to review items
4. User proceeds to `/checkout` page
5. User selects payment method (Stripe or Points)
6. User completes payment
7. System processes payment and fulfills order
8. User receives confirmation

### Technical Flow

```mermaid
graph TD
    subgraph User Interaction
        A[User browses /products] --> B[Adds items to Cart];
        B --> C[Visits /cart];
        C --> D[Proceeds to /checkout];
        D --> E{Selects Payment Method};
    end

    subgraph Stripe Payment Flow
        E -- Stripe --> F[POST /api/checkout (Stripe)];
        F --> G[Stripe Checkout Session Created];
        G --> H[User Completes Payment on Stripe];
        H --> I[Stripe Sends Webhook: checkout.session.completed];
        I --> J[POST /api/webhooks/stripe];
        J --> K[Process Webhook: Update DB];
        K --> L[DB: orders Inserted];
        K --> M[DB: order_items Inserted];
        K --> N[DB: cart_items Deleted];
        J --> O[User Receives Confirmation];
    end

    subgraph Points Payment Flow
        E -- Points --> P[POST /api/checkout (Points)];
        P --> Q[Validate Points Balance];
        Q -- Sufficient Points --> R[Process Order Atomically];
        R --> S[DB: orders Inserted];
        R --> T[DB: order_items Inserted];
        R --> U[DB: profiles Updated (Points Deducted)];
        R --> V[DB: points_transactions Inserted];
        R --> W[DB: cart_items Deleted];
        P --> X[User Receives Confirmation];
        Q -- Insufficient Points --> Y[Show Error to User];
    end
```

#### Step 1: Add to Cart
**Endpoint**: Frontend cart management (local state + database sync)

**Database Operations**:

| Table | Operation | Purpose |
|-------|-----------|---------|
| `cart_items` | INSERT/UPDATE | Store user's cart items |

#### Step 2: Checkout Process
**Endpoint**: `POST /api/checkout`

**For Stripe Payment**:
- Creates Stripe checkout session
- Stores cart items in session metadata

**For Points Payment**:
- Validates user has sufficient points
- Creates order immediately
- Processes transaction atomically

**Database Operations** (Points Payment):

| Table | Operation | Purpose |
|-------|-----------|---------|
| `orders` | INSERT | Create new order record |
| `order_items` | INSERT | Store ordered items details |
| `profiles` | UPDATE | Deduct points from user balance |
| `points_transactions` | INSERT | Record points spending |
| `cart_items` | DELETE | Clear user's cart |

#### Step 3: Webhook Processing (Stripe Payment)
**Event Type**: `checkout.session.completed`

**Database Operations**:

| Table | Operation | Purpose |
|-------|-----------|---------|
| `orders` | INSERT | Create order from cart metadata |
| `order_items` | INSERT | Store ordered items |
| `cart_items` | DELETE | Clear user's cart |

---

## Relationship Between Points and Image Purchases

This section clarifies the distinct yet interconnected nature of purchasing points versus purchasing images directly.

**1. Purchasing Points:**
   - **Purpose**: Users buy a virtual currency (points) that can *later* be used to acquire digital goods (images) within the application.
   - **Transaction Type**: This is a direct monetary transaction (e.g., USD to Points) facilitated by Stripe.
   - **Outcome**: User's `points` balance in the `profiles` table increases. A record is created in `points_transactions` with `type: 'purchase'`.
   - **Analogy**: Buying a gift card or topping up an in-app wallet.

**2. Purchasing Images:**
   - **Purpose**: Users acquire specific digital images.
   - **Payment Methods**:
      - **Using Stripe (Direct Monetary Purchase)**: Users can buy images directly with real money. This creates an `orders` record with `payment_method: 'stripe'`.
      - **Using Points (Virtual Currency Purchase)**: Users can spend their previously acquired points to get images. This creates an `orders` record with `payment_method: 'points'`.
   - **Outcome (if paying with points)**: User's `points` balance in the `profiles` table decreases. A record is created in `points_transactions` with `type: 'spend'`. An `orders` record is created, and `order_items` are populated.
   - **Outcome (if paying with Stripe)**: An `orders` record is created, and `order_items` are populated. No direct change to the user's points balance unless the purchase *also* included a points package (which is not a standard flow for image purchase).

**Key Distinctions & Interactions:**

- **Two-Step vs. One-Step**: Purchasing points is often the first step in a two-step process to get an image (Money -> Points -> Image). Purchasing an image directly with Stripe is a one-step process (Money -> Image).
- **Flexibility**: Points offer flexibility. Users can buy points in bulk (potentially at a discount or as part of a promotion) and spend them over time on various images.
- **Database Impact**:
    - **Points Purchase (Stripe)**:
        - `profiles`: `points` increases.
        - `points_transactions`: New record (`type: 'purchase'`).
    - **Image Purchase (Stripe)**:
        - `orders`: New record (`payment_method: 'stripe'`).
        - `order_items`: New records.
    - **Image Purchase (Points)**:
        - `profiles`: `points` decreases.
        - `points_transactions`: New record (`type: 'spend'`, linked to `order_id`).
        - `orders`: New record (`payment_method: 'points'`).
        - `order_items`: New records.

- **No Double Dipping**: When a user buys an image using points, they are *spending* points they already acquired. They are not buying points and an image simultaneously in that single transaction.
- **Separate Checkout Flows**: While both might use Stripe for the initial monetary transaction, the internal logic and metadata passed to Stripe differ:
    - Points purchase metadata: `user_id`, `points_amount`, `package_id`.
    - Image purchase (Stripe) metadata: `user_id`, `cart_items` (or `order_id`).

Understanding this distinction is crucial for accurate financial tracking, user balance management, and designing promotions or loyalty programs.

---

## Database Schema Overview

### Core Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `orders`
```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  total_cents INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('stripe', 'points')),
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `points_transactions`
```sql
CREATE TABLE points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL, -- positive for credits, negative for debits
  type TEXT CHECK (type IN ('purchase', 'spend', 'refund')),
  description TEXT,
  order_id UUID REFERENCES orders(id),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Relationship Diagram
```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
orders (1:many) → order_items (1:many) → products
    ↓
points_transactions (1:many)
```

---

## Current Implementation Analysis

### Strengths ✅
1. **Webhook-based Processing**: Reliable payment confirmation
2. **Atomic Transactions**: Points payments are processed atomically
3. **Comprehensive Audit Trail**: All transactions are logged
4. **RLS Security**: Row-level security policies protect user data
5. **Error Handling**: Graceful handling of missing profiles

### Weaknesses ⚠️
1. **Missing Order Status Updates**: Stripe payments don't update order status properly
2. **Incomplete Webhook Event Handling**: Only handles `checkout.session.completed`
3. **No Idempotency**: Webhook processing may create duplicates
4. **Limited Transaction Metadata**: Missing important fields
5. **No Inventory Management**: No stock tracking for products

---

## Optimization Recommendations

### 1. Enhanced Webhook Handling
```javascript
// Add idempotency key handling
const idempotencyKey = event.id
const existingTransaction = await checkExistingTransaction(idempotencyKey)
if (existingTransaction) {
  return NextResponse.json({ received: true })
}
```

### 2. Additional Webhook Events
Handle more Stripe events for better order management:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.payment_succeeded` (for subscriptions)
- `customer.subscription.created`

### 3. Enhanced Order Management
```sql
-- Add more order statuses
ALTER TABLE orders 
  ALTER COLUMN status 
  DROP CONSTRAINT orders_status_check,
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));

-- Add order fulfillment tracking
ALTER TABLE orders ADD COLUMN fulfilled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN tracking_info JSONB;
```

### 4. Improved Transaction Logging
```sql
-- Enhanced points_transactions table
ALTER TABLE points_transactions ADD COLUMN idempotency_key TEXT UNIQUE;
ALTER TABLE points_transactions ADD COLUMN metadata JSONB;
ALTER TABLE points_transactions ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
```

### 5. Inventory Management
```sql
-- Add inventory tracking
CREATE TABLE product_inventory (
  product_id UUID PRIMARY KEY REFERENCES products(id),
  stock_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Performance Optimization
- **Database Indexes**:
  ```sql
  CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
  CREATE INDEX idx_points_transactions_user_created ON points_transactions(user_id, created_at DESC);
  CREATE INDEX idx_cart_items_user ON cart_items(user_id);
  ```

- **Caching Strategy**:
    - Cache user profiles in Redis
    - Cache product data
    - Implement cart session caching

### 7. Enhanced Error Handling
```javascript
// Webhook error handling with retry logic
try {
  await processWebhook(event)
} catch (error) {
  // Log error for monitoring
  console.error('Webhook processing failed:', error)
  
  // Return 500 to trigger Stripe retry
  return NextResponse.json(
    { error: 'Processing failed' }, 
    { status: 500 }
  )
}
```

### 8. Order Fulfillment Workflow
```javascript
// Automated fulfillment for digital products
async function fulfillOrder(orderId) {
  const order = await getOrder(orderId)
  
  for (const item of order.items) {
    if (item.product.type === 'digital') {
      await generateDownloadLink(item.product_id, order.user_id)
      await sendFulfillmentEmail(order.user_id, item)
    }
  }
  
  await updateOrderStatus(orderId, 'fulfilled')
}
```

---

## Security Considerations

### 1. Webhook Verification
```javascript
// Verify webhook signature
const signature = request.headers.get('stripe-signature')
const payload = await request.text()

try {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )
} catch (err) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
}
```

### 2. Input Validation
- Validate all webhook payloads
- Sanitize metadata fields
- Verify user permissions before processing

### 3. Rate Limiting
- Implement rate limiting on webhook endpoints
- Add authentication for sensitive operations
- Monitor for suspicious activity

### 4. Data Protection
- Encrypt sensitive transaction data
- Implement audit logging
- Regular security audits

---

## Monitoring and Analytics

### Key Metrics to Track
1. **Purchase Conversion Rate**: Cart abandonment vs. completion
2. **Payment Method Usage**: Stripe vs. Points usage
3. **Transaction Failure Rates**: Failed payments and reasons
4. **Webhook Processing Time**: Performance monitoring
5. **User Spending Patterns**: Analytics for business insights

### Alerting Setup
- Failed webhook notifications
- High transaction failure rates
- Unusual spending patterns
- System performance degradation

---

## Testing Strategy

### Unit Tests
- Webhook processing logic
- Points calculation and deduction
- Order creation and validation

### Integration Tests
- End-to-end purchase flows
- Stripe webhook simulation
- Database transaction integrity

### Load Testing
- High-volume webhook processing
- Concurrent purchase scenarios
- Database performance under load

---

## Conclusion

The current purchase workflows provide a solid foundation but would benefit from the optimizations outlined above. Priority should be given to:

1. **Enhanced webhook handling** for reliability
2. **Improved order management** for better user experience
3. **Performance optimization** for scalability
4. **Comprehensive monitoring** for operational excellence

These improvements will create a more robust, scalable, and maintainable e-commerce system.
