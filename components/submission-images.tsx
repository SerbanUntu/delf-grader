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
 * @param toolbar Extra buttons shown in the toolbar above the images.
 */
export function SubmissionImages({
  savedPages,
  localPages,
  isUploaded,
  toolbar,
}: {
  savedPages: ViewerPage[];
  localPages: LocalPage[] | null | undefined;
  isUploaded: boolean;
  toolbar?: ReactNode;
}) {
  if (savedPages.length > 0) {
    return <PageViewer pages={savedPages} toolbar={toolbar} />;
  }
  if (localPages === undefined) {
    return <Skeleton className="h-80 rounded-xl" />;
  }
  if (localPages) {
    return (
      <PageViewer
        pages={localPages}
        badge={<LocalPagesBadge />}
        toolbar={toolbar}
      />
    );
  }
  return (
    <EmptyPageViewer>
      {isUploaded
        ? otherBrowserMessage
        : "The submission will appear here once it is uploaded."}
    </EmptyPageViewer>
  );
}
