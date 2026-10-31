import type { ReactNode } from "react";
import {
  EmptyPageViewer,
  LocalPagesBadge,
  PageViewer,
  type ViewerPage,
} from "@/components/page-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import type { LocalPage } from "@/lib/local-pages";

export const otherBrowserMessage =
  "The images of this submission are only available on the browser where they were uploaded.";

/**
 * Shows the redacted images saved on the server, or else the unredacted images kept in this browser, or else a message.
 *
 * @param savedPages The redacted images saved on the server.
 * @param localPages The unredacted images kept in this browser, null if there are none, or undefined while they load.
 * @param isUploaded Whether the submission was uploaded, possibly on another browser.
 */
export function SubmissionImages({
  savedPages,
  localPages,
  isUploaded,
}: {
  savedPages: ViewerPage[];
  localPages: LocalPage[] | null | undefined;
  isUploaded: boolean;
}) {
  if (savedPages.length > 0) {
    return <PageViewer pages={savedPages} />;
  }
  if (localPages === undefined) {
    return <Skeleton className="h-80 rounded-xl" />;
  }
  if (localPages) {
    return <PageViewer pages={localPages} badge={<LocalPagesBadge />} />;
  }
  return (
    <EmptyPageViewer>
      {isUploaded
        ? otherBrowserMessage
        : "The submission will appear here once it is uploaded."}
    </EmptyPageViewer>
  );
}

/**
 * Shows the submission images on one side and the content of a step on the other side.
 *
 * @param images The submission images.
 * @param children The content of the step.
 */
export function SideBySide({
  images,
  children,
}: {
  images: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <div className="min-w-0">{images}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
