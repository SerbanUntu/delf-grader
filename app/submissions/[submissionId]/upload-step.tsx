"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  TrashIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { useMutation } from "convex/react";
import Image from "next/image";
import { type DragEvent, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormError } from "@/components/form-error";
import { LocalPagesBadge } from "@/components/page-viewer";
import { otherBrowserMessage } from "@/components/submission-images";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errors";
import { maxPageCount, maxUploadSize } from "@/lib/format";
import { type LocalPage, saveLocalPages, usePageUrls } from "@/lib/local-pages";
import { acceptedFileTypes, PageError, readPageFiles } from "@/lib/page-images";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";

/**
 * The upload step, where the teacher picks the images or the PDF of the student's answer.
 *
 * @param submissionId The submission ID.
 * @param isUploaded Whether the submission was already uploaded, possibly on another browser.
 * @param isRedacted Whether the redacted images are already saved on the server.
 * @param localPages The unredacted images kept in this browser, null if there are none, or undefined while they load.
 * @param stepsToRerun The steps that will be re-run if new files are saved.
 * @param onSaved Called once the new files are saved.
 */
export function UploadStep({
  submissionId,
  isUploaded,
  isRedacted,
  localPages,
  stepsToRerun,
  onSaved,
}: {
  submissionId: Id<"submissions">;
  isUploaded: boolean;
  isRedacted: boolean;
  localPages: LocalPage[] | null | undefined;
  stepsToRerun: string[];
  onSaved: () => void;
}) {
  const saveUpload = useMutation(api.submissions.saveUpload);
  const [pickedFiles, setPickedFiles] = useState<Blob[] | null>(null);
  const pickedPages = usePageUrls(pickedFiles);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string>();

  async function pickFiles(files: File[]) {
    setError(undefined);
    setIsReading(true);
    try {
      setPickedFiles(await readPageFiles(files));
    } catch (caught) {
      setError(
        caught instanceof PageError
          ? caught.message
          : "The files could not be read. Please try again.",
      );
    } finally {
      setIsReading(false);
    }
  }

  async function save() {
    if (!pickedFiles) {
      return;
    }
    setError(undefined);
    setIsSaving(true);
    try {
      await saveLocalPages(submissionId, pickedFiles);
      await saveUpload({ submissionId });
      setPickedFiles(null);
      onSaved();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  function movePage(index: number, offset: number) {
    if (!pickedFiles) {
      return;
    }
    const reordered = [...pickedFiles];
    const [page] = reordered.splice(index, 1);
    reordered.splice(index + offset, 0, page);
    setPickedFiles(reordered);
  }

  function removePage(index: number) {
    const remaining = pickedFiles?.filter((_, other) => other !== index) ?? [];
    setPickedFiles(remaining.length > 0 ? remaining : null);
  }

  return (
    <section className="grid gap-5">
      <StepHeading title="Upload">
        Pick photos or scans of the student&apos;s answer: one or more images,
        or one PDF, with at most {maxPageCount} pages and{" "}
        {maxUploadSize / 1024 / 1024} MB. The files stay in this browser until
        the redaction is saved.
      </StepHeading>

      {pickedFiles ? (
        <>
          <p className="font-medium">
            Check the order of the pages, then save.
          </p>
          <PageThumbnails
            pages={pickedPages ?? []}
            onMove={movePage}
            onRemove={removePage}
          />
          <FormError message={error} />
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={isSaving || !pickedPages}
              onClick={() => {
                if (stepsToRerun.length > 0) {
                  setIsConfirming(true);
                } else {
                  void save();
                }
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => {
                setPickedFiles(null);
                setError(undefined);
              }}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          {isRedacted && (
            <Alert className="text-base">
              <AlertDescription className="text-base">
                The redacted images are saved. Choosing new files replaces them,
                and the submission goes back to the redaction step.
              </AlertDescription>
            </Alert>
          )}
          {isUploaded && !isRedacted && localPages === null && (
            <Alert className="text-base">
              <AlertDescription className="text-base">
                {otherBrowserMessage} To continue on this browser, choose the
                files again.
              </AlertDescription>
            </Alert>
          )}
          <DropZone isReading={isReading} onFiles={pickFiles} />
          <FormError message={error} />
          {localPages && !isRedacted && (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold">Uploaded pages</h3>
                <LocalPagesBadge />
              </div>
              <PageThumbnails pages={localPages} />
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title="Replace the uploaded files?"
        description={
          <>
            <p>Saving the new files will re-run these steps:</p>
            <ul className="mt-2 list-disc pl-6">
              {stepsToRerun.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            <p className="mt-2">Their previous results will be replaced.</p>
          </>
        }
        onConfirm={save}
      />
    </section>
  );
}

function DropZone({
  isReading,
  onFiles,
}: {
  isReading: boolean;
  onFiles: (files: File[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!isReading) {
      onFiles([...event.dataTransfer.files]);
    }
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-10 text-center transition-colors",
        "focus-within:ring-2 focus-within:ring-ring hover:border-curry",
        isDragging && "border-curry bg-curry-soft",
        isReading && "cursor-wait opacity-70",
      )}
    >
      <UploadIcon aria-hidden className="size-8 text-muted-foreground" />
      <span className="text-lg font-semibold">
        {isReading ? "Reading the files..." : "Choose images or a PDF"}
      </span>
      <span className="text-muted-foreground">
        or drop them here. JPEG, PNG, WebP or PDF.
      </span>
      <input
        type="file"
        multiple
        accept={acceptedFileTypes}
        disabled={isReading}
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length > 0) {
            onFiles(files);
          }
        }}
      />
    </label>
  );
}

function PageThumbnails({
  pages,
  onMove,
  onRemove,
}: {
  pages: LocalPage[];
  onMove?: (index: number, offset: number) => void;
  onRemove?: (index: number) => void;
}) {
  return (
    <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {pages.map((page, index) => (
        <li
          key={page.id}
          className="flex flex-col overflow-hidden rounded-lg border bg-card"
        >
          <div className="flex aspect-3/4 items-center justify-center bg-muted/50 p-2">
            <Image
              src={page.url}
              alt={`Page ${index + 1}`}
              width={0}
              height={0}
              sizes="16rem"
              unoptimized
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between gap-1 border-t px-2 py-1.5">
            <span className="px-1 font-medium">Page {index + 1}</span>
            {onMove && onRemove && (
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Move page ${index + 1} earlier`}
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                >
                  <ArrowLeftIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Move page ${index + 1} later`}
                  disabled={index === pages.length - 1}
                  onClick={() => onMove(index, 1)}
                >
                  <ArrowRightIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove page ${index + 1}`}
                  onClick={() => onRemove(index)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
