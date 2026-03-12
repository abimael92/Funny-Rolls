# API Routes Structure

## 📦 Core APIs

High-level structure for REST-style routes under `/app/api` (Next.js App Router):

```text
/api/
├── production/
│   ├── batches/
│   │   ├── GET       # list with filters (date, recipe, status)
│   │   ├── POST      # create new batch
│   │   └── [id]/
│   │       ├── GET   # fetch single batch
│   │       ├── PATCH # update status / notes / links to orders
│   │       └── DELETE# cancel or soft-delete batch
│   ├── quality/
│   │   ├── POST      # record quality check for batch
│   │   └── [batchId]/
│   │       └── GET   # fetch quality control history
│   └── calculator/
│       └── POST      # calculate ingredient/tool requirements for a plan
├── inventory/
│   ├── items/
│   │   ├── GET       # list with filters (category, low-stock)
│   │   ├── POST      # add new ingredient
│   │   └── [id]/
│   │       ├── GET
│   │       ├── PATCH # update quantity, thresholds, pricing
│   │       └── DELETE
│   ├── movements/
│   │   ├── GET       # movement history
│   │   └── POST      # record movement (adjustment, purchase, usage)
│   └── alerts/
│       └── GET       # low stock alerts
├── recipes/
│   ├── GET           # list with filters
│   ├── POST          # create recipe
│   └── [id]/
│       ├── GET
│       ├── PATCH
│       └── DELETE
├── orders/
│   ├── GET           # list with filters (status, date, client)
│   ├── POST          # create order
│   └── [id]/
│       ├── GET
│       ├── PATCH     # update status
│       ├── POST/cancel
│       └── POST/invoice # generate CFDI
├── clients/
│   ├── GET           # list with search
│   ├── POST          # create client
│   └── [id]/
│       ├── GET
│       ├── PATCH
│       ├── DELETE
│       └── orders/
│           └── GET   # client order history
├── shopping-list/
│   ├── GET           # current list
│   ├── POST          # generate from production plan
│   └── items/
│       └── [id]/
│           └── PATCH # mark purchased / cancelled
├── suppliers/
│   ├── GET
│   ├── POST
│   └── [id]/
│       ├── GET
│       ├── PATCH
│       └── DELETE
├── expenses/
│   ├── GET           # with filters (category, date)
│   ├── POST
│   └── [id]/
│       ├── GET
│       ├── PATCH
│       └── DELETE
├── reports/
│   ├── sales/
│   │   ├── daily
│   │   ├── monthly
│   │   └── by-product
│   ├── production/
│   │   ├── efficiency
│   │   └── quality
│   ├── inventory/
│   │   ├── valuation
│   │   └── turnover
│   └── financial/
│       ├── pnl       # profit & loss
│       └── cogs      # cost of goods sold
└── admin/
    ├── users/
    ├── roles/
    └── settings/
```

