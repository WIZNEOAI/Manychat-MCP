/**
 * Generated `api` utility.
 *
 * Regenerate with `npx convex dev` after changing Convex functions or components.
 * @module
 */

import type {
  ApiFromModules,
  AnyComponents,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as billing from "../billing.js";
import type * as dashboard from "../dashboard.js";
import type * as stripeActions from "../stripeActions.js";
import type * as users from "../users.js";

declare const fullApi: ApiFromModules<{
  billing: typeof billing;
  dashboard: typeof dashboard;
  stripeActions: typeof stripeActions;
  users: typeof users;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference>;
export declare const components: AnyComponents;
