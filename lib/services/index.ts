/**
 * Service layer – read-only data access. Single source of truth.
 *
 * Rules:
 * - UI must use these services only; do not import from lib/data or lib/mock-data.
 * - Services are read-only; no mutations yet.
 */

export { getProducts } from "./products";
export { getIngredients } from "./ingredients";
export {
  getTools,
  getToolCategories,
  type ToolCategoryOption,
  type ToolCategoriesMap,
} from "./tools";
export { getProductionRecords } from "./production";
export { getSales, getPaymentIntents } from "./sales";
export {
	createOrderFromCart,
	createOrder,
	getOrderById,
	listOrders,
	getCartTotals,
	getDailySalesSummary,
	type CartTotals,
	type CreateOrderPayload,
	type DailySalesSummary,
} from "./orders";
export {
	startCheckout,
	completePayment,
	getPaymentStatus,
	type StartCheckoutResult,
	type CompletePaymentPayload,
} from "./payments";