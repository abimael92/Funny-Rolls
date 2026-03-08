# Funny Rolls — Deployment

## Environment variables

Create `.env.local` (or set in your host):

```bash
# Supabase (required for POS DB)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Server-only; never expose

# Stripe (optional; for card payments)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Email (optional; for receipts)
SENDGRID_API_KEY=...   # or RESEND_API_KEY
```

## Database

1. In Supabase SQL Editor (or via CLI), run each file in `supabase/migrations/` in order.
2. Ensure `ingredients` has columns `current_stock`, `price_per_unit`, `reorder_level`, `category` (migration 001).
3. Ensure RLS is enabled and service_role can write.

## Stripe webhook

1. In Stripe Dashboard → Developers → Webhooks, add endpoint: `https://your-domain.com/api/payments/webhook`.
2. Select event `payment_intent.succeeded`.
3. Copy signing secret to `STRIPE_WEBHOOK_SECRET`.

## Build and run

```bash
yarn install
yarn build
yarn start
```

Or use Vercel/Netlify: connect repo, set env vars, deploy. Use Node 18+.

## Fallback behavior

If `SUPABASE_SERVICE_ROLE_KEY` is not set, order/payment APIs return 503. The frontend falls back to localStorage (OrderStore/PaymentStore) so the app still works for demo; orders are not persisted in DB.
