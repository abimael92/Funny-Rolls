/**
 * Sales service – read-only. Single source of truth for sales and payment intents.
 * UI must use this service; do not import from lib/data directly.
 */

import type { Sale, PaymentIntent } from "../types";
import { mockSales as salesData, mockPaymentIntents as paymentIntentsData } from "../data";

/**
 * Returns mock sales. Read-only.
 */
export function getSales(): readonly Sale[] {
  return salesData;
}

/**
 * Returns mock payment intents. Read-only.
 */
export function getPaymentIntents(): readonly PaymentIntent[] {
  return paymentIntentsData;
}
