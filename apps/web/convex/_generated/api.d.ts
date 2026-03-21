/**
 * Generated `api` utility.
 *
 * Regenerate with `npx convex dev` after changing Convex functions.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as dashboard from "../dashboard.js";
import type * as users from "../users.js";

declare const fullApi: ApiFromModules<{
  dashboard: typeof dashboard;
  users: typeof users;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference>;
