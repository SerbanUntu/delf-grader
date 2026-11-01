/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as ai from "../ai.js";
import type * as classes from "../classes.js";
import type * as cleanup from "../cleanup.js";
import type * as crons from "../crons.js";
import type * as grading from "../grading.js";
import type * as model from "../model.js";
import type * as sessions from "../sessions.js";
import type * as studentKeys from "../studentKeys.js";
import type * as submissions from "../submissions.js";
import type * as transcription from "../transcription.js";
import type * as validation from "../validation.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  ai: typeof ai;
  classes: typeof classes;
  cleanup: typeof cleanup;
  crons: typeof crons;
  grading: typeof grading;
  model: typeof model;
  sessions: typeof sessions;
  studentKeys: typeof studentKeys;
  submissions: typeof submissions;
  transcription: typeof transcription;
  validation: typeof validation;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
