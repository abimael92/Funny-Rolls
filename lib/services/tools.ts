/**
 * Tools service – read-only. Single source of truth for tools and tool categories.
 * UI must use this service; do not import from lib/data directly.
 */

import type { Tool } from "../types";
import { defaultTools, toolCategories as toolCategoriesData } from "../data";

export type ToolCategoryOption = { value: string; label: string };
export type ToolCategoriesMap = Record<
  string,
  readonly ToolCategoryOption[]
>;

/**
 * Returns the default/global tools catalog. Read-only.
 */
export function getTools(): readonly Tool[] {
  return defaultTools;
}

/**
 * Returns tool category options by tool type (consumible, herramienta, equipo). Read-only.
 */
export function getToolCategories(): ToolCategoriesMap {
  return toolCategoriesData as ToolCategoriesMap;
}
