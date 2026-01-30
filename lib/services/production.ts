/**
 * Production service – read-only. Single source of truth for production records.
 * UI must use this service; do not import from lib/mock-data directly.
 */

import type { ProductionRecord, Recipe } from "../types";
import { generateMockProductionData } from "../mock-data";
import { getProducts } from "./products";

/**
 * Returns mock production records for the current product/recipe set. Read-only.
 * Data is derived from products; no persistence yet.
 */
export function getProductionRecords(): readonly ProductionRecord[] {
  const products = getProducts();
  const recipes: Recipe[] = products.map((p) => p.recipe);
  return generateMockProductionData(recipes, [...products]);
}
