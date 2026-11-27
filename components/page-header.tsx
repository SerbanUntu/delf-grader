import Link from "next/link";
import { Fragment } from "react";
import { Logo } from "@/components/logo";
import { StudentNamesHelp } from "@/components/student-names-help";
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
 * The header shown at the top of every page, with the logo, the breadcrumbs, the student names help button and the user menu.
 *
 * @param breadcrumbs The path to the current page, starting with "Classes". The last entry is the current page.
 */
export function PageHeader({
  breadcrumbs,
}: {
  breadcrumbs: BreadcrumbEntry[];
}) {
  return (
    <header className="top-0 z-40 border-b bg-background/85 backdrop-blur-sm sm:sticky">
      <div className="container flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold"
        >
          <Logo className="h-7 w-auto" />
          DELF Grader
        </Link>
        <Breadcrumb className="order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1 sm:basis-0">
          <BreadcrumbList>
            {breadcrumbs.map((entry, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={entry.href ?? entry.label}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem className="max-w-[calc(100%-1.5rem)] min-w-0">
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
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <StudentNamesHelp />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
