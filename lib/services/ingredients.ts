/**
 * Ingredients service – read-only. Single source of truth for ingredient data.
 * UI must use this service; do not import from lib/data directly.
 */

import type { Ingredient } from "../types";
import { defaultIngredients } from "../data";

/**
 * Returns the default/global ingredient catalog. Read-only.
 */
export function getIngredients(): readonly Ingredient[] {
  return defaultIngredients;
}
