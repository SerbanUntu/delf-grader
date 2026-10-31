import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

/**
 * A card linking to a class, session or submission.
 *
 * @param href The page of the item.
 * @param title The name of the item.
 * @param details Short lines shown under the name, such as the exam date.
 * @param actions The item's menu, shown in the top right corner.
 */
export function ItemCard({
  href,
  title,
  details,
  actions,
}: {
  href: string;
  title: string;
  details?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Card className="relative flex min-h-32 flex-col gap-2 p-5 transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-lg leading-snug font-semibold wrap-break-word">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {title}
          </Link>
        </h3>
        {actions && <div className="relative z-10 -mt-1 -mr-2">{actions}</div>}
      </div>
      {details && <div className="text-muted-foreground">{details}</div>}
    </Card>
  );
}
