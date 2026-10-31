import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "./_generated/server";

const maxErrorLength = 1000;

/**
 * Creates the model that transcribes the pages, Gemini 3.8 Flash.
 *
 * @returns The transcriber model.
 */
export function getTranscriberModel() {
  const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  return google("gemini-3.8-flash");
}

/**
 * Creates the model that grades the transcription, Claude Opus 5.5.
 *
 * @returns The grader model.
 */
export function getGraderModel() {
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return anthropic("claude-opus-5-5");
}

/**
 * Turns an error thrown while running a step into a message that is shown to the teacher.
 *
 * @param stepLabel The name of the step, such as "transcription".
 * @param error The thrown error.
 * @returns The message.
 */
export function describeStepFailure(stepLabel: string, error: unknown): string {
  const details =
    error instanceof Error && error.message ? ` ${error.message}` : "";
  return `The ${stepLabel} failed.${details}`.slice(0, maxErrorLength);
}
