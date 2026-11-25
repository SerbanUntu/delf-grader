import Link from "next/link";
import type { ReactNode } from "react";
import { ScoreCircle } from "@/components/score-circle";
import { Card } from "@/components/ui/card";

/**
 * A card linking to a class, session or submission, with its statistics at the bottom.
 *
 * @param href The page of the item.
 * @param title The name of the item.
 * @param cover An image shown above the name.
 * @param details Short lines shown under the name, such as the exam date.
 * @param actions The item's menu, shown in the top right corner.
 * @param score The score shown at the bottom, or null when there is not enough data, which shows "N/A".
 * @param scoreExtra Shown next to the score, such as the change from the previous session.
 */
export function ItemCard({
  href,
  title,
  cover,
  details,
  actions,
  score,
  scoreExtra,
}: {
  href: string;
  title: string;
  cover?: ReactNode;
  details?: ReactNode;
  actions?: ReactNode;
  score: number | null;
  scoreExtra?: ReactNode;
}) {
  return (
    <Card className="relative flex flex-col overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
      {cover}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-lg leading-snug font-semibold wrap-break-word">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:rounded-xl"
            >
              {title}
            </Link>
          </h3>
          {actions && (
            <div className="relative z-10 -mt-1 -mr-2">{actions}</div>
          )}
        </div>
        {details && <div className="text-muted-foreground">{details}</div>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <ScoreCircle score={score} />
          {scoreExtra}
        </div>
      </div>
    </Card>
  );
}
