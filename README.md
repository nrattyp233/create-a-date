<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gH2LdLDqrcGIgEOUAXHZm_kZp1J5pe8s

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Premium payments (PayPal) setup

This project includes a server-verified PayPal flow using Supabase Edge Functions. The client never flips premium on its own; it calls your functions which verify the payment with PayPal and then update the database.

What you need:
- A Supabase project (the client is already configured in `services/supabaseClient.ts`).
- PayPal REST app credentials (Client ID and Secret) for Sandbox or Live.

Edge functions (server):
- `supabase/functions/create-paypal-order` – creates a PayPal order, inserts a pending row in `orders`, and returns `{ orderID, approveLink }`.
- `supabase/functions/capture-paypal-order` – captures the order via PayPal, sets `orders.status = 'paid'`, and marks the purchaser as premium in `users.is_premium`.
- `supabase/functions/paypal-webhook` – processes PayPal webhooks for redundancy; when a capture completes, it marks the order as paid and sets the user to premium.

Environment variables for the functions (set in your Supabase project > Edge Functions > Secrets):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE` – `sandbox` (default) or `live`

Database table expected by the functions/UI (`orders`):
```
-- Minimal schema reference; adjust types/indexes as needed
create table if not exists public.orders (
  order_id uuid primary key default gen_random_uuid(),
  user_id integer not null references public.users(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'pending', -- pending | paid | failed
  paypal_order_id text,
  paypal_transaction_id text,
  created_at timestamp with time zone default now()
);
```

Deploy functions:
- Use the Supabase CLI or Dashboard to deploy the three functions under `supabase/functions/*`.
- For local dev with the CLI, ensure your client points to your local Supabase URL and anon key, or deploy to your remote project so `supabase.functions.invoke()` reaches the cloud functions.

Client behavior:
- The “Go Premium” button opens the Monetization modal (`components/MonetizationModal.tsx`).
- It calls `create-paypal-order` to get an order and an approval link (opens in a new tab).
- After you approve in PayPal, click “Confirm Premium Purchase” to invoke `capture-paypal-order`.
- On success, the app refreshes the current user and you’ll see Premium enabled.

Notes:
- For production, secure the webhook with PayPal signature verification and re-enable JWT verification if you front your webhook with your own gateway. The current config disables JWT for easier local testing.
