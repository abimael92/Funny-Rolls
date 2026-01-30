/**
 * Products service – read-only. Single source of truth for product data.
 * UI must use this service; do not import from lib/data or mock data directly.
 */

import type { Product } from "../types";
import { products as productsData } from "../data";

/**
 * Returns all products (with computed cost/margin). Read-only.
 */
export function getProducts(): readonly Product[] {
  return productsData;
}
