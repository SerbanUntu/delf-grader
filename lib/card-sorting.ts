import { useSyncExternalStore } from "react";
import { z } from "zod";
import {
  readStorageItem,
  subscribeToStorage,
  writeStorageItem,
} from "./local-storage";
import { maxTotalScore } from "./scores";

const sortOrders = [
  "newest",
  "oldest",
  "highestScore",
  "lowestScore",
  "name",
] as const;

export type SortOrder = (typeof sortOrders)[number];

export const sortOrderLabels: Record<SortOrder, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  highestScore: "Highest score",
  lowestScore: "Lowest score",
  name: "Name A to Z",
};

const scoreBoundSchema = z.number().min(0).max(maxTotalScore).nullable();

const cardViewSchema = z.object({
  sortOrder: z.enum(sortOrders),
  minScore: scoreBoundSchema,
  maxScore: scoreBoundSchema,
});

export type CardView = z.infer<typeof cardViewSchema>;

export const defaultCardView: CardView = {
  sortOrder: "newest",
  minScore: null,
  maxScore: null,
};

/**
 * The fields a card needs to be sorted and filtered. Cards without an exam date are sorted by when they were created.
 */
export type SortableCard = {
  _creationTime: number;
  examDate?: string;
  score: number | null;
};

const cachedViews = new Map<string, { text: string | null; view: CardView }>();

function parseView(text: string | null): CardView {
  if (!text) {
    return defaultCardView;
  }
  try {
    return cardViewSchema.parse(JSON.parse(text));
  } catch {
    return defaultCardView;
  }
}

function readView(storageName: string): CardView {
  const text = readStorageItem(storageName);
  const cached = cachedViews.get(storageName);
  if (cached?.text === text) {
    return cached.view;
  }
  const view = parseView(text);
  cachedViews.set(storageName, { text, view });
  return view;
}

/**
 * Reads the sort order and score filter of a card grid, remembered in local storage, and updates when they change.
 *
 * @param storageName The name under which the grid's choices are kept.
 * @returns The current choices and a function that changes some of them.
 */
export function useCardView(storageName: string) {
  const view = useSyncExternalStore(
    subscribeToStorage,
    () => readView(storageName),
    () => defaultCardView,
  );

  function changeView(changes: Partial<CardView>) {
    writeStorageItem(
      storageName,
      JSON.stringify({ ...readView(storageName), ...changes }),
    );
  }

  return { view, changeView };
}

/**
 * Checks whether a minimum or maximum score is set, in which case cards without a score are hidden.
 *
 * @param view The choices of the grid.
 * @returns Whether the score filter is set.
 */
export function isScoreFilterSet(view: CardView): boolean {
  return view.minScore !== null || view.maxScore !== null;
}

function compareNewest(first: SortableCard, second: SortableCard): number {
  const byDate = (second.examDate ?? "").localeCompare(first.examDate ?? "");
  return byDate || second._creationTime - first._creationTime;
}

function compareScores(
  first: number | null,
  second: number | null,
  direction: 1 | -1,
): number {
  if (first === null || second === null) {
    return Number(first === null) - Number(second === null);
  }
  return (first - second) * direction;
}

function compareNames(first: string, second: string): number {
  if (!first || !second) {
    return Number(!first) - Number(!second);
  }
  return first.localeCompare(second, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

/**
 * Filters cards by score and sorts them as chosen. Cards without a score or a name always come last.
 *
 * @param cards The cards.
 * @param view The sort order and score filter.
 * @param getName Reads the name a card is sorted by for "Name A to Z".
 * @returns The cards to show, in order.
 */
export function sortAndFilterCards<Card extends SortableCard>(
  cards: Card[],
  view: CardView,
  getName: (card: Card) => string,
): Card[] {
  const { minScore, maxScore } = view;
  const shown = isScoreFilterSet(view)
    ? cards.filter(
        ({ score }) =>
          score !== null &&
          (minScore === null || score >= minScore) &&
          (maxScore === null || score <= maxScore),
      )
    : cards;
  return shown.toSorted((first, second) => {
    switch (view.sortOrder) {
      case "oldest":
        return compareNewest(second, first);
      case "highestScore":
        return (
          compareScores(first.score, second.score, -1) ||
          compareNewest(first, second)
        );
      case "lowestScore":
        return (
          compareScores(first.score, second.score, 1) ||
          compareNewest(first, second)
        );
      case "name":
        return (
          compareNames(getName(first), getName(second)) ||
          compareNewest(first, second)
        );
      default:
        return compareNewest(first, second);
    }
  });
}
