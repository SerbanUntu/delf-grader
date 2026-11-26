"use client";

import { LanguageFlag } from "@/components/language-flag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type FeedbackLanguage,
  feedbackLanguageNames,
  feedbackLanguages,
  isFeedbackLanguage,
} from "@/lib/languages";

/**
 * A dropdown with a flag for each language the grader can write its feedback in.
 *
 * @param value The chosen feedback language.
 * @param onChange Called with the newly chosen language.
 */
export function FeedbackLanguageSelect({
  value,
  onChange,
}: {
  value: FeedbackLanguage;
  onChange: (language: FeedbackLanguage) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (isFeedbackLanguage(next)) {
          onChange(next);
        }
      }}
    >
      <SelectTrigger
        aria-label="Feedback language"
        title="Feedback language"
        className="h-9 w-auto gap-2"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {feedbackLanguages.map((language) => (
          <SelectItem key={language} value={language}>
            <span className="flex items-center gap-2">
              <LanguageFlag language={language} />
              {feedbackLanguageNames[language]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
