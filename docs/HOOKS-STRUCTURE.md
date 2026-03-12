# Custom Hooks Structure

```typescript
// lib/hooks/useProduction.ts
- useProductionBatches   // list with filters, pagination, realtime
- useProductionBatch     // single batch CRUD + status updates
- useProductionCalculator// calculate ingredient/tool requirements for a plan
- useQualityControl      // record and track batch quality control

// lib/hooks/useInventory.ts
- useInventoryItems      // list with filters (category, low stock)
- useInventoryItem       // single item operations
- useInventoryMovements  // movement history
- useStockAlerts         // low stock monitoring / subscriptions

// lib/hooks/useRecipes.ts
- useRecipes             // list with filters
- useRecipe              // single recipe CRUD
- useRecipeCost          // calculate costs using real ingredient prices

// lib/hooks/useOrders.ts
- useOrders              // list with filters (status, date, client)
- useOrder               // single order operations
- useOrderItems          // order details + derived totals

// lib/hooks/useClients.ts
- useClients             // list with search
- useClient              // single client operations
- useClientOrders        // order history per client

// lib/hooks/useShoppingList.ts
- useShoppingList        // current list snapshot
- useShoppingListItems   // item-level management (add/update/status)

// lib/hooks/useReports.ts
- useSalesReport         // daily/monthly/by-product sales
- useProductionReport    // efficiency, yield, quality KPIs
- useInventoryReport     // valuation and turnover
- useFinancialReport     // P&L, COGS and margins

// lib/hooks/useSupabase.ts
- useSupabase            // typed Supabase client wrapper (browser)
- useRealtime            // channel/subscription helper
```

