# Complete Data Flow

## 🔄 Production -> Inventory

When a production batch is completed:

1. System calculates ingredient usage based on recipe.
2. Updates inventory (decreases quantities) via inventory transactions.
3. Creates `batch_quality_control` record with accepted/rejected units.
4. Updates production statistics (per-recipe and per-day aggregates).
5. Triggers shopping list generation if stock falls below minimum.

## 🛒 Inventory -> Shopping List

Shopping list is automatically generated when:

- Stock falls below minimum threshold.
- Production is planned that would use more than available stock.
- A manager explicitly requests a generation run from the admin UI.

## 📦 Orders -> Production

Order flow:

1. Customer order created (walk-in, phone, online).
2. Inventory checked for required items (finished goods and WIP).
3. If items need production, production batches are planned and linked to the order.
4. Order status updated through workflow (pending → preparing → ready → delivered).
5. Payment recorded with method and SAT-compliant codes.
6. Delivery / pickup processed and order marked completed.

## 💰 Costs -> Pricing

Cost calculation per batch:

1. Sum of (ingredient quantity × current ingredient price).
2. Add labor cost (hours × hourly rate).
3. Add overhead allocation (utilities, rent, tools depreciation).
4. Calculate cost per unit.
5. Apply markup for selling price (minimum 2.5× cost for wholesale, 3× for retail).

## 📊 Reports -> Dashboard

Key metrics:

- Daily sales (orders, revenue, average ticket).
- Production efficiency (units produced, acceptance rate).
- Inventory value and turnover.
- Cost of goods sold (COGS).
- Gross margin by product.
- Customer acquisition and retention.
- Top selling products.
- Low stock alerts.

## 🧾 Mexican Commercial Standards

- CFDI requirements for invoicing.
- RFC validation for businesses.
- Tax calculation (IVA).
- Payment method codes for SAT.
- Fiscal address and regime requirements.

