import Link from "next/link";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UserMenu } from "@/components/user-menu";

export type BreadcrumbEntry = {
  label: string;
  href?: string;
};

/**
 * The header shown at the top of every page, with the breadcrumbs and the user menu.
 *
 * @param breadcrumbs The path to the current page, starting with "Classes". The last entry is the current page.
 */
export function PageHeader({
  breadcrumbs,
}: {
  breadcrumbs: BreadcrumbEntry[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-sm">
      <div className="container flex min-h-16 items-center justify-between gap-4 py-3">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-semibold"
          >
            <span
              aria-hidden
              className="size-3 rounded-full bg-linear-to-br from-curry to-curry/70"
            />
            DELF Grader
          </Link>
          <Breadcrumb className="min-w-0">
            <BreadcrumbList>
              {breadcrumbs.map((entry, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <Fragment key={entry.href ?? entry.label}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem className="min-w-0">
                      {isLast || !entry.href ? (
                        <BreadcrumbPage className="truncate">
                          {entry.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="truncate">
                          <Link href={entry.href}>{entry.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
