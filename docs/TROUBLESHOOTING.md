# Funny Rolls — Troubleshooting

## Orders not saving in database

- **Check:** Is `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local`?
- **Check:** Have you run all migrations in `supabase/migrations/`? In particular `orders` and `order_items` must exist.
- **Behavior:** If the API returns 503 or the create request fails, the app falls back to localStorage; orders will appear in the daily summary but not in Supabase.

## Order number not showing (FR-YYYY-XXXXX)

- **Check:** Migration `20250130000006_order_number_seq.sql` must be run so that `generate_order_number()` exists.
- **Fallback:** The create-order API uses a timestamp-based number if the RPC fails.

## Inventory not decrementing

- **Check:** Order items must have `recipe_id` set when the order is created (from `product.recipe.id`). If the frontend sends items without `recipeId`, the complete API has nothing to decrement.
- **Check:** `ingredients` must have `current_stock` column (migration 001).
- **Check:** Recipe in DB must have `ingredients` JSONB with `ingredient_id` or `ingredientId` and `amount`; and `batch_size`.

## Stripe payment not updating order

- **Check:** Webhook URL in Stripe Dashboard must match your deployed URL (e.g. `https://yoursite.com/api/payments/webhook`).
- **Check:** `STRIPE_WEBHOOK_SECRET` must match the signing secret from the Dashboard.
- **Check:** Event `payment_intent.succeeded` is selected for the webhook.
- **Test:** Use Stripe CLI: `stripe listen --forward-to localhost:2000/api/payments/webhook`.

## Kitchen page shows "Failed to load orders"

- **Check:** Same as “Orders not saving” — Supabase and migrations must be correct.
- **Check:** CORS is not blocking (same-origin is fine; if kitchen is on another domain, configure CORS or use same domain).

## Build errors (Stripe, Supabase)

- **Stripe:** Run `yarn add stripe @stripe/stripe-js @stripe/react-stripe-js` if not already in package.json.
- **Supabase:** Ensure `@supabase/supabase-js` is installed and env vars are set (build can succeed without them; runtime may 503).

## RLS blocking writes

- **Check:** API routes use `supabaseAdmin` (service role), which bypasses RLS. If you use the anon client for writes, ensure RLS policies allow the intended operations.
