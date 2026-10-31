"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { FormError } from "@/components/form-error";
import {
  EmptyPageViewer,
  LocalPagesBadge,
  PageViewer,
  type ViewerPage,
} from "@/components/page-viewer";
import { otherBrowserMessage } from "@/components/submission-images";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errors";
import { deleteLocalPages, type LocalPage } from "@/lib/local-pages";
import { encodePageAsJpeg, PageError } from "@/lib/page-images";
import { StepHeading } from "./step-heading";

/**
 * The redaction step, where the teacher checks the pages and sends them to the server.
 *
 * @param submissionId The submission ID.
 * @param savedPages The redacted images saved on the server.
 * @param localPages The unredacted images kept in this browser, null if there are none, or undefined while they load.
 * @param onSaved Called once the redacted images are saved.
 */
export function RedactionStep({
  submissionId,
  savedPages,
  localPages,
  onSaved,
}: {
  submissionId: Id<"submissions">;
  savedPages: ViewerPage[];
  localPages: LocalPage[] | null | undefined;
  onSaved: () => void;
}) {
  const generateUploadUrls = useMutation(api.submissions.generateUploadUrls);
  const savePages = useMutation(api.submissions.savePages);
  const [savedCount, setSavedCount] = useState<number>();
  const [error, setError] = useState<string>();

  async function uploadPage(page: LocalPage, uploadUrl: string) {
    const jpeg = await encodePageAsJpeg(page.blob);
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: jpeg,
    });
    if (!response.ok) {
      throw new PageError("The images could not be sent. Please try again.");
    }
    const { storageId } = (await response.json()) as {
      storageId: Id<"_storage">;
    };
    return storageId;
  }

  async function save() {
    if (!localPages) {
      return;
    }
    setError(undefined);
    setSavedCount(0);
    try {
      const uploadUrls = await generateUploadUrls({
        submissionId,
        count: localPages.length,
      });
      const pageIds: Id<"_storage">[] = [];
      for (const [index, page] of localPages.entries()) {
        pageIds.push(await uploadPage(page, uploadUrls[index]));
        setSavedCount(index + 1);
      }
      await savePages({ submissionId, pageIds });
      await deleteLocalPages([submissionId]).catch(() => undefined);
      onSaved();
    } catch (caught) {
      setError(
        caught instanceof PageError ? caught.message : getErrorMessage(caught),
      );
    } finally {
      setSavedCount(undefined);
    }
  }

  if (savedPages.length > 0) {
    return (
      <section className="grid gap-5">
        <StepHeading title="Redaction">
          The redacted images are saved on the server.
        </StepHeading>
        <div className="max-w-3xl">
          <PageViewer pages={savedPages} />
        </div>
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

  const isSaving = savedCount !== undefined;

  return (
    <section className="grid gap-5">
      <StepHeading title="Redaction">
        Check that the pages do not show personal information, such as the
        student&apos;s name.
      </StepHeading>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={isSaving} onClick={() => void save()}>
          {isSaving
            ? `Saving page ${Math.min(savedCount + 1, localPages.length)} of ${localPages.length}...`
            : "Save (no redactions)"}
        </Button>
      </div>
      <FormError message={error} />
      <div className="max-w-3xl">
        <PageViewer pages={localPages} badge={<LocalPagesBadge />} />
      </div>
    </section>
  );
}
