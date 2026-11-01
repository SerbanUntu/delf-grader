"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormError } from "@/components/form-error";
import { EmptyPageViewer, LocalPagesBadge } from "@/components/page-viewer";
import { otherBrowserMessage } from "@/components/submission-images";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errors";
import { deleteLocalPages, type LocalPage } from "@/lib/local-pages";
import { encodePageAsJpeg, PageError } from "@/lib/page-images";
import { type DrawnRectangle, RedactionEditor } from "./redaction-editor";
import { StepHeading } from "./step-heading";
import { RerunDescription } from "./step-status";

type SavedPage = { id: Id<"_storage">; url: string };

type RedactionPage = {
  id: string;
  url: string;
  blob?: Blob;
  storageId?: Id<"_storage">;
};

/**
 * The redaction step, where the teacher hides personal information on the pages and sends them to the server.
 *
 * @param submissionId The submission ID.
 * @param savedPages The redacted images saved on the server.
 * @param localPages The unredacted images kept in this browser, null if there are none, or undefined while they load.
 * @param stepsToRerun The steps that will be re-run if the redaction is saved.
 * @param onSaved Called once the redacted images are saved.
 */
export function RedactionStep({
  submissionId,
  savedPages,
  localPages,
  stepsToRerun,
  onSaved,
}: {
  submissionId: Id<"submissions">;
  savedPages: SavedPage[];
  localPages: LocalPage[] | null | undefined;
  stepsToRerun: string[];
  onSaved: () => void;
}) {
  if (savedPages.length > 0) {
    return (
      <section className="grid gap-5">
        <StepHeading title="Redaction">
          The redacted images are saved on the server. To hide more information,
          draw new rectangles and save. Saved rectangles cannot be removed, so
          to start over, upload new files.
        </StepHeading>
        <RedactionForm
          key={savedPages.map((page) => page.id).join()}
          submissionId={submissionId}
          pages={savedPages.map((page) => ({ ...page, storageId: page.id }))}
          stepsToRerun={stepsToRerun}
          onSaved={onSaved}
        />
      </section>
    );
  }

  if (localPages === undefined) {
    return <Skeleton className="h-80 rounded-xl" />;
  }

  if (localPages === null) {
    return (
      <section className="grid gap-5">
        <StepHeading title="Redaction" />
        <EmptyPageViewer>{otherBrowserMessage}</EmptyPageViewer>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <StepHeading title="Redaction">
        Draw black rectangles over any personal information, such as the
        student&apos;s name. Saving burns them into the images for good and
        sends the images to the server. If there is nothing to hide, save
        without drawing.
      </StepHeading>
      <RedactionForm
        key={localPages.map((page) => page.id).join()}
        submissionId={submissionId}
        pages={localPages}
        stepsToRerun={stepsToRerun}
        onSaved={onSaved}
      />
    </section>
  );
}

async function readPageImage(page: RedactionPage): Promise<Blob> {
  if (page.blob) {
    return page.blob;
  }
  const response = await fetch(page.url).catch(() => undefined);
  if (!response?.ok) {
    throw new PageError(
      "The saved images could not be read. Please try again.",
    );
  }
  return await response.blob();
}

async function uploadPage(jpeg: Blob, uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg" },
    body: jpeg,
  }).catch(() => undefined);
  if (!response?.ok) {
    throw new PageError("The images could not be sent. Please try again.");
  }
  const { storageId } = (await response.json()) as {
    storageId: Id<"_storage">;
  };
  return storageId;
}

function RedactionForm({
  submissionId,
  pages,
  stepsToRerun,
  onSaved,
}: {
  submissionId: Id<"submissions">;
  pages: RedactionPage[];
  stepsToRerun: string[];
  onSaved: () => void;
}) {
  const generateUploadUrls = useMutation(api.submissions.generateUploadUrls);
  const savePages = useMutation(api.submissions.savePages);
  const [rectangles, setRectangles] = useState<DrawnRectangle[][]>(() =>
    pages.map(() => []),
  );
  const [progress, setProgress] = useState<{ done: number; total: number }>();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const isSaved = pages.some((page) => page.storageId !== undefined);
  const rectangleCount = rectangles.flat().length;
  const isSaving = progress !== undefined;

  async function save() {
    const keptPageIds = pages.map((page, index) =>
      rectangles[index].length === 0 ? page.storageId : undefined,
    );
    const total = keptPageIds.filter((pageId) => !pageId).length;
    setError(undefined);
    setProgress({ done: 0, total });
    try {
      const uploadUrls = await generateUploadUrls({
        submissionId,
        count: total,
      });
      const pageIds: Id<"_storage">[] = [];
      let done = 0;
      for (const [index, page] of pages.entries()) {
        const keptPageId = keptPageIds[index];
        if (keptPageId) {
          pageIds.push(keptPageId);
          continue;
        }
        const jpeg = await encodePageAsJpeg(
          await readPageImage(page),
          rectangles[index],
        );
        pageIds.push(await uploadPage(jpeg, uploadUrls[done]));
        done++;
        setProgress({ done, total });
      }
      await savePages({ submissionId, pageIds });
      if (!isSaved) {
        await deleteLocalPages([submissionId]).catch(() => undefined);
      }
      onSaved();
    } catch (caught) {
      setError(
        caught instanceof PageError ? caught.message : getErrorMessage(caught),
      );
    } finally {
      setProgress(undefined);
    }
  }

  function getSaveLabel() {
    if (progress) {
      return `Saving page ${Math.min(progress.done + 1, progress.total)} of ${progress.total}...`;
    }
    return rectangleCount === 0 && !isSaved ? "Save (no redactions)" : "Save";
  }

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground">
        Drag on a page to draw a rectangle. Click a rectangle to select it, then
        press Delete to remove it. Press Ctrl+Z to undo.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={isSaving || (isSaved && rectangleCount === 0)}
          onClick={() => {
            if (stepsToRerun.length > 0) {
              setIsConfirming(true);
            } else {
              void save();
            }
          }}
        >
          {getSaveLabel()}
        </Button>
        <span className="text-muted-foreground">
          {rectangleCount} {rectangleCount === 1 ? "rectangle" : "rectangles"}{" "}
          {isSaved ? "added" : "drawn"}
        </span>
      </div>
      <FormError message={error} />
      <div className="max-w-4xl">
        <RedactionEditor
          pages={pages}
          rectangles={rectangles}
          onChange={setRectangles}
          disabled={isSaving}
          badge={isSaved ? undefined : <LocalPagesBadge />}
        />
      </div>

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title="Save the redaction?"
        description={
          <RerunDescription
            action="Saving the new rectangles"
            steps={stepsToRerun}
          />
        }
        onConfirm={save}
      />
    </div>
  );
}
