import { useSyncExternalStore } from "react";
import {
  defaultFeedbackLanguage,
  type FeedbackLanguage,
  isFeedbackLanguage,
} from "./languages";
import {
  readStorageItem,
  subscribeToStorage,
  writeStorageItem,
} from "./local-storage";

const storageName = "feedback-language";

function readFeedbackLanguage(): FeedbackLanguage {
  const value = readStorageItem(storageName);
  return isFeedbackLanguage(value) ? value : defaultFeedbackLanguage;
}

/**
 * Reads the language in which the grader writes its feedback, chosen in this browser for the whole app, and updates when it changes.
 *
 * @returns The feedback language, French when none was chosen.
 */
export function useFeedbackLanguage(): FeedbackLanguage {
  return useSyncExternalStore(
    subscribeToStorage,
    readFeedbackLanguage,
    () => defaultFeedbackLanguage,
  );
}

/**
 * Remembers the feedback language in this browser.
 *
 * @param language The feedback language.
 */
export function saveFeedbackLanguage(language: FeedbackLanguage) {
  writeStorageItem(storageName, language);
}
