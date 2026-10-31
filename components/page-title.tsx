import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * The main heading of a page, with optional buttons or menus next to it.
 *
 * @param title The heading.
 * @param actions Buttons or menus shown on the right.
 * @param children Short lines shown under the heading.
 */
export function PageTitle({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight wrap-break-word">
          {title}
        </h1>
        {children && (
          <div className="mt-1 text-muted-foreground">{children}</div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * The heading of a section of a page, with optional buttons next to it.
 *
 * @param title The heading.
 * @param actions Buttons shown on the right.
 */
export function SectionTitle({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {actions}
    </div>
  );
}

/**
 * The message shown when a page's item does not exist, was deleted or belongs to another teacher.
 *
 * @param itemType The kind of item, such as "class".
 */
export function MissingItem({ itemType }: { itemType: string }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">
        This {itemType} does not exist or was deleted.
      </h1>
      <Button asChild className="mt-6">
        <Link href="/">Back to classes</Link>
      </Button>
    </div>
  );
}
