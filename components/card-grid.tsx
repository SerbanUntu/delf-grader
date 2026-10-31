import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A grid of cards, with placeholders while the items load and a message when there are none.
 *
 * @param items The items, or undefined while they load.
 * @param emptyMessage The message shown when there are no items.
 * @param renderItem Renders the card of one item.
 */
export function CardGrid<Item extends { _id: string }>({
  items,
  emptyMessage,
  renderItem,
}: {
  items: Item[] | undefined;
  emptyMessage: string;
  renderItem: (item: Item) => ReactNode;
}) {
  if (items?.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items
        ? items.map(renderItem)
        : ["first", "second", "third"].map((key) => (
            <Skeleton key={key} className="h-32 rounded-xl" />
          ))}
    </div>
  );
}
