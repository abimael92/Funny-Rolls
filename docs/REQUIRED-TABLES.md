# Required Tables for Complete System

## 📦 Existing Tables (Keep)

- `production_batches`
- `recipes`
- `ingredients`
- `inventory`
- `profiles`
- `user_roles`
- `roles`

## 🆕 New Tables to Create

1. **orders**

   - `id`: uuid (PK)
   - `client_id`: uuid (FK to `clients`)
   - `order_date`: timestamp
   - `status`: `order_status` (pending, paid, preparing, ready, delivered, cancelled)
   - `subtotal`: decimal
   - `tax`: decimal
   - `total`: decimal
   - `payment_method`: `payment_method_type`
   - `cfdi_use`: text (for invoicing)
   - `rfc`: text (optional, for invoicing)
   - `notes`: text
   - `created_by`: uuid (FK to `users`)
   - `created_at`: timestamp
   - `updated_at`: timestamp

2. **clients**

   - `id`: uuid (PK)
   - `name`: text
   - `email`: text
   - `phone`: text
   - `address`: text
   - `rfc`: text (optional, for invoicing)
   - `business_name`: text (optional)
   - `client_type`: `client_type` (individual, business)
   - `credit_limit`: decimal (optional)
   - `payment_terms`: integer (days)
   - `notes`: text
   - `created_by`: uuid (FK to `users`)
   - `created_at`: timestamp
   - `updated_at`: timestamp

3. **order_items**

   - `id`: uuid (PK)
   - `order_id`: uuid (FK to `orders`)
   - `recipe_id`: uuid (FK to `recipes`)
   - `quantity`: integer
   - `unit_price`: decimal (price at time of order)
   - `subtotal`: decimal
   - `notes`: text
   - `created_at`: timestamp

4. **batch_quality_control**

   - `id`: uuid (PK)
   - `batch_id`: uuid (FK to `production_batches`)
   - `units_produced`: integer
   - `units_accepted`: integer
   - `units_rejected`: integer
   - `rejection_reason`: text
   - `inspector_id`: uuid (FK to `users`)
   - `notes`: text
   - `created_at`: timestamp

5. **shopping_list**

   - `id`: uuid (PK)
   - `ingredient_id`: uuid (FK to `ingredients`)
   - `quantity_needed`: decimal
   - `unit`: text
   - `estimated_cost`: decimal
   - `actual_cost`: decimal (optional)
   - `status`: `shopping_list_status` (pending, purchased, cancelled)
   - `supplier`: text (optional)
   - `purchase_order_id`: uuid (FK to `purchase_orders` - future)
   - `notes`: text
   - `created_by`: uuid (FK to `users`)
   - `created_at`: timestamp
   - `completed_at`: timestamp (optional)

6. **purchase_orders**

   - `id`: uuid (PK)
   - `supplier_id`: uuid (FK to `suppliers` - future)
   - `order_date`: timestamp
   - `expected_delivery`: timestamp
   - `status`: `purchase_order_status` (draft, sent, received, cancelled)
   - `subtotal`: decimal
   - `tax`: decimal
   - `total`: decimal
   - `notes`: text
   - `created_by`: uuid (FK to `users`)
   - `created_at`: timestamp
   - `updated_at`: timestamp

7. **suppliers**

   - `id`: uuid (PK)
   - `name`: text
   - `contact_person`: text
   - `email`: text
   - `phone`: text
   - `address`: text
   - `rfc`: text
   - `payment_terms`: integer (days)
   - `notes`: text
   - `created_by`: uuid (FK to `users`)
   - `created_at`: timestamp
   - `updated_at`: timestamp

8. **expense_categories**

   - `id`: uuid (PK)
   - `name`: text
   - `description`: text
   - `type`: `expense_type` (ingredient, labor, overhead, marketing, etc.)
   - `created_at`: timestamp
   - `updated_at`: timestamp

9. **expenses**

   - `id`: uuid (PK)
   - `category_id`: uuid (FK to `expense_categories`)
   - `amount`: decimal
   - `description`: text
   - `expense_date`: timestamp
   - `payment_method`: `payment_method_type`
   - `receipt_url`: text (optional)
   - `notes`: text
   - `created_by`: uuid (FK to `users`)
   - `created_at`: timestamp
   - `updated_at`: timestamp

## 🔄 ENUMS to Create

```sql
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE client_type AS ENUM ('individual', 'business');
CREATE TYPE payment_method_type AS ENUM ('cash', 'card', 'transfer', 'credit');
CREATE TYPE shopping_list_status AS ENUM ('pending', 'purchased', 'cancelled');
CREATE TYPE purchase_order_status AS ENUM ('draft', 'sent', 'received', 'cancelled');
CREATE TYPE expense_type AS ENUM ('ingredient', 'labor', 'overhead', 'marketing', 'other');
CREATE TYPE production_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
```

