import { ConvexError } from "convex/values";

/**
 * Turns an error thrown by a Convex function into a message that can be shown to the teacher.
 *
 * @param error The thrown error.
 * @returns The message of a ConvexError, or a generic message for any other error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }
  return "Something went wrong. Please try again.";
}
