"use client";

import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type CardView,
  isScoreFilterSet,
  type SortableCard,
  type SortOrder,
  sortAndFilterCards,
  sortOrderLabels,
  useCardView,
} from "@/lib/card-sorting";
import { formatNumber } from "@/lib/format";
import { maxTotalScore } from "@/lib/scores";

/**
 * A grid of cards with a sort dropdown and a score filter, remembered in local storage. Shows placeholders while the items load and a message when there are none.
 *
 * @param items The items, or undefined while they load.
 * @param storageName The name under which the chosen sort order and score filter are kept.
 * @param getName Reads the name an item is sorted by for "Name A to Z".
 * @param nameSortLabel The label of the "Name A to Z" choice.
 * @param emptyMessage The message shown when there are no items.
 * @param renderItem Renders the card of one item.
 */
export function CardGrid<Item extends SortableCard & { _id: string }>({
  items,
  storageName,
  getName,
  nameSortLabel = sortOrderLabels.name,
  emptyMessage,
  renderItem,
}: {
  items: Item[] | undefined;
  storageName: string;
  getName: (item: Item) => string;
  nameSortLabel?: string;
  emptyMessage: string;
  renderItem: (item: Item) => ReactNode;
}) {
  const { view, changeView } = useCardView(storageName);

  if (items?.length === 0) {
    return <EmptyGrid>{emptyMessage}</EmptyGrid>;
  }

  const shownItems = items && sortAndFilterCards(items, view, getName);

  return (
    <div className="grid gap-4">
      <CardGridControls
        view={view}
        changeView={changeView}
        nameSortLabel={nameSortLabel}
      />
      {shownItems?.length === 0 ? (
        <EmptyGrid>No items have a score in this range.</EmptyGrid>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shownItems
            ? shownItems.map(renderItem)
            : ["first", "second", "third"].map((key) => (
                <Skeleton key={key} className="h-40 rounded-xl" />
              ))}
        </div>
      )}
    </div>
  );
}

function EmptyGrid({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
      {children}
    </p>
  );
}

function CardGridControls({
  view,
  changeView,
  nameSortLabel,
}: {
  view: CardView;
  changeView: (changes: Partial<CardView>) => void;
  nameSortLabel: string;
}) {
  const sortId = useId();
  const labels = { ...sortOrderLabels, name: nameSortLabel };

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor={sortId} className="text-base">
          Sort by
        </Label>
        <Select
          value={view.sortOrder}
          onValueChange={(sortOrder) =>
            changeView({ sortOrder: sortOrder as SortOrder })
          }
        >
          <SelectTrigger id={sortId} className="h-10 w-48 bg-card text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(labels).map(([sortOrder, label]) => (
              <SelectItem
                key={sortOrder}
                value={sortOrder}
                className="text-base"
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <fieldset className="flex flex-wrap items-end gap-3">
        <legend className="sr-only">Score filter</legend>
        <ScoreInput
          label="Minimum score"
          placeholder="0"
          value={view.minScore}
          onChange={(minScore) => changeView({ minScore })}
        />
        <ScoreInput
          label="Maximum score"
          placeholder={formatNumber(maxTotalScore)}
          value={view.maxScore}
          onChange={(maxScore) => changeView({ maxScore })}
        />
        {isScoreFilterSet(view) && (
          <Button
            variant="ghost"
            className="h-10 text-base"
            onClick={() => changeView({ minScore: null, maxScore: null })}
          >
            Clear filter
          </Button>
        )}
      </fieldset>
    </div>
  );
}

function parseScore(text: string): number | null | undefined {
  const trimmed = text.trim().replace(",", ".");
  if (!trimmed) {
    return null;
  }
  const score = Number(trimmed);
  return Number.isFinite(score) && score >= 0 && score <= maxTotalScore
    ? score
    : undefined;
}

function formatScore(score: number | null): string {
  return score === null ? "" : formatNumber(score);
}

function ScoreInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: number | null;
  onChange: (score: number | null) => void;
}) {
  const id = useId();
  const [text, setText] = useState(formatScore(value));
  const [shownValue, setShownValue] = useState(value);

  if (value !== shownValue) {
    setShownValue(value);
    if (parseScore(text) !== value) {
      setText(formatScore(value));
    }
  }

  const isInvalid = parseScore(text) === undefined;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${id}-error` : undefined}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const score = parseScore(event.target.value);
          if (score !== undefined) {
            onChange(score);
          }
        }}
        className="h-10 w-28 bg-card text-base aria-invalid:border-destructive"
      />
      {isInvalid && (
        <span id={`${id}-error`} className="sr-only">
          Enter a number from 0 to {maxTotalScore}.
        </span>
      )}
    </div>
  );
}
