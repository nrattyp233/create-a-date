# Admin Features and PayPal Integration Setup Guide

## Overview

This implementation adds comprehensive admin features and PayPal payment integration to the Create-A-Date app, allowing:

1. **Admin Dashboard**: Statistics and analytics for app usage and revenue
2. **PayPal Integration**: Secure $10 premium upgrades with payment verification
3. **Revenue Tracking**: Complete payment history and revenue analytics

## Features Implemented

### 🛡️ Admin Dashboard
- **User Statistics**: Total users, premium vs regular user counts
- **Revenue Analytics**: Total revenue from premium subscriptions 
- **Payment History**: Recent transactions with status tracking
- **Admin-Only Access**: Only visible to designated admin users

### 💳 PayPal Payment System
- **$10 Premium Upgrades**: Fixed pricing for premium subscriptions
- **Secure Processing**: Server-side PayPal API integration
- **Payment Verification**: Premium status granted only after verified payment
- **Webhook Handling**: Automatic processing of payment completions
- **Transaction Tracking**: Complete audit trail of all payments

## Setup Instructions

### 1. Database Schema

You'll need to create these tables in your Supabase database:

```sql
-- Add admin flag to existing users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create payment orders table
CREATE TABLE payment_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    paypal_transaction_id TEXT,
    paypal_data JSONB,
    capture_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_created_at ON payment_orders(created_at);
```

### 2. Environment Variables

Set these environment variables for PayPal integration:

**For Local Development (.env.local):**
```bash
# Admin Configuration
ADMIN_USER_ID=1  # Set to your user ID to make yourself admin

# PayPal Configuration (use sandbox for testing)
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_WEBHOOK_ID=your_webhook_id
FRONTEND_URL=http://localhost:5173

# Supabase (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**For Production:**
```bash
PAYPAL_ENVIRONMENT=production
# Use production PayPal credentials
```

### 3. Supabase Edge Functions Deployment

Deploy the PayPal integration functions:

```bash
# Deploy PayPal order creation function
supabase functions deploy create-paypal-order

# Deploy PayPal order capture function  
supabase functions deploy capture-paypal-order

# Deploy updated webhook handler
supabase functions deploy paypal-webhook
```

### 4. PayPal Webhook Configuration

1. Log into your PayPal Developer Dashboard
2. Create a webhook endpoint pointing to: `https://your-supabase-project.supabase.co/functions/v1/paypal-webhook`
3. Subscribe to these events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.DECLINED`
4. Copy the Webhook ID to your `PAYPAL_WEBHOOK_ID` environment variable

## Usage Guide

### Admin Access

1. **Set Admin User**: Set the `ADMIN_USER_ID` environment variable to your user ID
2. **Admin Badge**: Admin users will see an "Admin" badge in the header
3. **Stats Access**: Admin users will see a stats icon in the navigation
4. **Dashboard**: Click the stats icon to view the admin dashboard

### Admin Dashboard Features

- **User Metrics**: 
  - Total registered users
  - Premium vs regular user breakdown
  - Growth analytics

- **Revenue Tracking**:
  - Total revenue from premium subscriptions
  - Recent payment transactions
  - Payment status monitoring

- **Payment History**:
  - Transaction IDs and amounts
  - User information
  - Payment status (completed/pending/failed)
  - Payment dates

### Payment Flow

1. **User Clicks Upgrade**: User attempts to access premium feature or clicks upgrade
2. **PayPal Order Creation**: Frontend calls `create-paypal-order` function
3. **PayPal Redirect**: User redirected to PayPal for payment
4. **Payment Completion**: PayPal processes payment
5. **Webhook Notification**: PayPal sends webhook to confirm payment
6. **Premium Activation**: System automatically grants premium status
7. **User Notification**: User sees premium features unlocked

## Security Features

- **Server-Side Verification**: All PayPal communication happens server-side
- **Payment Verification**: Premium status only granted after confirmed payment
- **Webhook Validation**: PayPal webhooks verify payment authenticity
- **Admin Protection**: Admin features only accessible to designated users
- **Transaction Logging**: Complete audit trail of all payment attempts

## API Endpoints

### Admin Statistics
```typescript
// Get admin statistics
GET /api/admin/stats
Response: {
  totalUsers: number;
  premiumUsers: number;
  regularUsers: number;
  totalRevenue: number;
  recentPayments: PaymentRecord[];
}
```

### Payment Functions
```typescript
// Create PayPal order
POST /functions/v1/create-paypal-order
Body: { amount: 10.00 }
Response: { orderID: string, approvalUrl: string }

// Capture PayPal payment
POST /functions/v1/capture-paypal-order
Body: { orderID: string }
Response: { success: boolean, transactionId: string }
```

## Testing

### Test Payment Flow
1. Use PayPal sandbox credentials
2. Test with sandbox PayPal accounts
3. Verify premium status is granted after payment
4. Check admin dashboard shows the transaction

### Test Admin Features
1. Set `ADMIN_USER_ID` to your test user ID
2. Verify admin badge appears in header
3. Click stats icon to view dashboard
4. Confirm user statistics are accurate

## Production Checklist

- [ ] Database tables created and indexed
- [ ] PayPal production credentials configured
- [ ] Supabase Edge Functions deployed
- [ ] PayPal webhooks configured and tested
- [ ] Admin user ID set correctly
- [ ] SSL/HTTPS enabled for webhook endpoint
- [ ] Payment flow tested end-to-end
- [ ] Admin dashboard tested with real data

## Troubleshooting

### Common Issues

1. **PayPal Connection Fails**
   - Check PayPal credentials in environment variables
   - Verify PAYPAL_ENVIRONMENT is set correctly (sandbox/production)
   - Ensure Supabase functions are deployed

2. **Premium Status Not Granted**
   - Check webhook endpoint is receiving PayPal notifications
   - Verify payment_orders table exists and is populated
   - Check Supabase function logs for errors

3. **Admin Dashboard Not Showing**
   - Verify ADMIN_USER_ID environment variable is set
   - Check user ID matches exactly
   - Ensure user exists in database

4. **Stats Not Loading**
   - Check Supabase connection and permissions
   - Verify payment_orders table exists
   - Check browser console for errors

### Support

For additional support:
1. Check Supabase function logs for errors
2. Verify PayPal webhook delivery in PayPal dashboard
3. Check browser console for frontend errors
4. Review database logs for constraint violations

## Architecture Notes

The implementation follows these principles:
- **Security First**: All payments processed server-side
- **Minimal Changes**: Surgical updates to existing codebase
- **Scalable Design**: Database schema supports future enhancements
- **Admin Separation**: Clear separation between admin and user features
- **Payment Verification**: Multiple verification steps prevent fraud