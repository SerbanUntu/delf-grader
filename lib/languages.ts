import { v } from "convex/values";

export const feedbackLanguages = ["en", "ro", "fr"] as const;

export type FeedbackLanguage = (typeof feedbackLanguages)[number];

export const defaultFeedbackLanguage: FeedbackLanguage = "fr";

/**
 * The language of grading results saved before the feedback language could be chosen, which were all written in English.
 */
export const legacyFeedbackLanguage: FeedbackLanguage = "en";

export const feedbackLanguageValidator = v.union(
  ...feedbackLanguages.map((language) => v.literal(language)),
);

export const feedbackLanguageNames: Record<FeedbackLanguage, string> = {
  fr: "French",
  en: "English",
  ro: "Romanian",
};

/**
 * Checks that a value is one of the feedback languages.
 *
 * @param value The value to check.
 * @returns Whether the value is a feedback language.
 */
export function isFeedbackLanguage(value: unknown): value is FeedbackLanguage {
  return feedbackLanguages.some((language) => language === value);
}
