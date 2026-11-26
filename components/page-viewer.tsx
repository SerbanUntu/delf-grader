"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { type ReactNode, useRef, useState } from "react";
import { usePageZoom, ZoomArea, ZoomControls } from "@/components/page-zoom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ViewerPage = {
  id: string;
  url: string;
};

/**
 * Shows a student page at reading size.
 *
 * @param page The page image.
 * @param alt The text read by screen readers, empty for a copy that only repeats what is already shown.
 */
export function PageImage({ page, alt }: { page: ViewerPage; alt: string }) {
  return (
    <Image
      src={page.url}
      alt={alt}
      width={0}
      height={0}
      sizes="(min-width: 1024px) 75vw, 100vw"
      unoptimized
      draggable={false}
      className="block h-auto w-full rounded-md bg-white shadow-sm select-none"
    />
  );
}

/**
 * Shows the pages of a submission one under the other, with zoom, a magnifier and buttons to go to the previous or next page.
 *
 * @param pages The page images in order.
 * @param badge A short label shown above the pages, such as "Not redacted yet".
 */
export function PageViewer({
  pages,
  badge,
}: {
  pages: ViewerPage[];
  badge?: ReactNode;
}) {
  const zoom = usePageZoom("viewer");
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  function goToPage(index: number) {
    const scrollArea = zoom.viewportRef.current;
    const page = pageRefs.current[index];
    if (scrollArea && page) {
      scrollArea.scrollTo({
        top: page.offsetTop,
        behavior: "smooth",
      });
    }
    setCurrentIndex(index);
  }

  function handleScroll() {
    const scrollArea = zoom.viewportRef.current;
    if (!scrollArea) {
      return;
    }
    const isAtEnd =
      scrollArea.scrollTop + scrollArea.clientHeight >=
      scrollArea.scrollHeight - 1;
    const middle = scrollArea.scrollTop + scrollArea.clientHeight / 2;
    const index = isAtEnd
      ? pages.length - 1
      : pageRefs.current.findLastIndex(
          (page) => page !== null && page.offsetTop <= middle,
        );
    setCurrentIndex(Math.max(0, index));
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/50">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b bg-card px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="font-medium">
            Page {Math.min(currentIndex + 1, pages.length)} of {pages.length}
          </span>
          {badge}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <ZoomControls zoom={zoom} />
          {pages.length > 1 && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={currentIndex === 0}
                onClick={() => goToPage(currentIndex - 1)}
              >
                <ChevronLeftIcon className="size-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={currentIndex >= pages.length - 1}
                onClick={() => goToPage(currentIndex + 1)}
              >
                <ChevronRightIcon className="size-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <ZoomArea
        zoom={zoom}
        onScroll={handleScroll}
        className="h-[75vh] min-h-80"
        magnified={pages.map((page) => (
          <PageImage key={page.id} page={page} alt="" />
        ))}
      >
        {pages.map((page, index) => (
          <div
            key={page.id}
            ref={(element) => {
              pageRefs.current[index] = element;
            }}
          >
            <PageImage page={page} alt={`Page ${index + 1}`} />
          </div>
        ))}
      </ZoomArea>
    </div>
  );
}

/**
 * The area where the submission images are shown, holding a message when there are no images to show.
 *
 * @param children The message.
 */
export function EmptyPageViewer({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed bg-muted/40 px-6 py-10 text-center text-muted-foreground">
      <p className="max-w-sm">{children}</p>
    </div>
  );
}

/**
 * A badge shown above images that are not redacted yet.
 */
export function LocalPagesBadge() {
  return (
    <Badge variant="outline" className="border-curry bg-curry-soft text-sm">
      Not saved
    </Badge>
  );
}
