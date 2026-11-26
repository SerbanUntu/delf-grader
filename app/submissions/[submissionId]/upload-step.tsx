"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { useMutation } from "convex/react";
import Image from "next/image";
import { type DragEvent, type ReactNode, useState } from "react";
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
import { type LocalPage, saveLocalPages, useBlobUrl } from "@/lib/local-pages";
import { acceptedFileTypes, PageError, readPageFiles } from "@/lib/page-images";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";
import { RerunDescription } from "./step-status";

type PickedPage = {
  id: string;
  blob: Blob;
};

/**
 * The upload step, where the teacher picks the images and PDFs of the student's answer and puts the pages in order.
 *
 * @param submissionId The submission ID.
 * @param isUploaded Whether the submission was already uploaded, possibly on another browser.
 * @param isRedacted Whether the redacted images are already saved on the server.
 * @param localPages The unredacted images kept in this browser, null if there are none, or undefined while they load.
 * @param stepsToRerun The steps that will be re-run if the pages are saved.
 * @param onSaved Called once the pages are saved.
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
  const [changedPages, setChangedPages] = useState<PickedPage[] | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string>();

  const savedPages =
    localPages && !isRedacted
      ? localPages.map((page) => ({ id: page.id, blob: page.blob }))
      : null;
  const pages = changedPages ?? savedPages;

  async function addFiles(files: File[]) {
    const currentPages = pages ?? [];
    setError(undefined);
    setIsReading(true);
    try {
      const blobs = await readPageFiles(
        files,
        currentPages.map((page) => page.blob),
      );
      const newPages = blobs.map((blob) => ({
        id: crypto.randomUUID(),
        blob,
      }));
      setChangedPages((previous) => [
        ...(previous ?? currentPages),
        ...newPages,
      ]);
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

  function movePage(from: number, to: number) {
    if (!pages) {
      return;
    }
    const reordered = [...pages];
    const [page] = reordered.splice(from, 1);
    reordered.splice(to, 0, page);
    setChangedPages(reordered);
  }

  function removePage(index: number) {
    const remaining = (pages ?? []).filter((_, other) => other !== index);
    setError(undefined);
    setChangedPages(remaining.length > 0 || savedPages ? remaining : null);
  }

  async function save() {
    if (!changedPages || changedPages.length === 0) {
      return;
    }
    setError(undefined);
    setIsSaving(true);
    try {
      await saveLocalPages(
        submissionId,
        changedPages.map((page) => page.blob),
      );
      await saveUpload({ submissionId });
      setChangedPages(null);
      onSaved();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-5">
      <StepHeading title="Upload">
        Pick photos or scans of the student&apos;s answer, as images, PDFs or
        both, with at most {maxPageCount} pages and{" "}
        {maxUploadSize / 1024 / 1024} MB in all. The files stay in this browser
        until the redaction is saved.
      </StepHeading>

      {pages ? (
        <>
          {changedPages ? (
            <p className="font-medium">
              Drag the pages to put them in order, then save.
            </p>
          ) : (
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold">Uploaded pages</h3>
                <LocalPagesBadge />
              </div>
              <p className="text-muted-foreground">
                You can still add, reorder and remove pages until the redaction
                is saved.
              </p>
            </div>
          )}
          <PageGrid
            pages={pages}
            isReading={isReading}
            onAddFiles={addFiles}
            onMove={movePage}
            onRemove={removePage}
          />
          <FormError message={error} />
          {changedPages && (
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isSaving || isReading || changedPages.length === 0}
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
                  setChangedPages(null);
                  setError(undefined);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
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
          <FileDropArea
            isDisabled={isReading}
            onFiles={addFiles}
            className={cn(
              "flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl bg-card px-6 py-10",
              isReading && "cursor-wait opacity-70",
            )}
          >
            <UploadIcon aria-hidden className="size-8 text-muted-foreground" />
            <span className="text-lg font-semibold">
              {isReading ? "Reading the files..." : "Choose images or PDFs"}
            </span>
            <span className="text-muted-foreground">
              or drop them here. JPEG, PNG, WebP or PDF.
            </span>
          </FileDropArea>
          <FormError message={error} />
        </>
      )}

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title="Save the new pages?"
        description={
          <RerunDescription
            action="Saving the new pages"
            steps={stepsToRerun}
          />
        }
        onConfirm={save}
      />
    </section>
  );
}

function FileDropArea({
  isDisabled,
  onFiles,
  className,
  children,
}: {
  isDisabled: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
  children: ReactNode;
}) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    if (!event.dataTransfer.types.includes("Files")) {
      return;
    }
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const files = [...event.dataTransfer.files];
    if (!isDisabled && files.length > 0) {
      onFiles(files);
    }
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "cursor-pointer border-2 border-dashed text-center transition-colors",
        "focus-within:ring-2 focus-within:ring-ring hover:border-curry",
        isDragging && "border-curry bg-curry-soft",
        isDisabled && "cursor-not-allowed hover:border-border",
        className,
      )}
    >
      {children}
      <input
        type="file"
        multiple
        accept={acceptedFileTypes}
        disabled={isDisabled}
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

function PageGrid({
  pages,
  isReading,
  onAddFiles,
  onMove,
  onRemove,
}: {
  pages: PickedPage[];
  isReading: boolean;
  onAddFiles: (files: File[]) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const isFull = pages.length >= maxPageCount;

  function dragOver(index: number) {
    const from = pages.findIndex((page) => page.id === draggedId);
    if (from !== -1 && from !== index) {
      onMove(from, index);
    }
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
      <ol className="contents">
        {pages.map((page, index) => (
          <PageCard
            key={page.id}
            page={page}
            index={index}
            pageCount={pages.length}
            isDragged={page.id === draggedId}
            isDragging={draggedId !== null}
            onDragStart={() => setDraggedId(page.id)}
            onDragOver={() => dragOver(index)}
            onDragEnd={() => setDraggedId(null)}
            onMove={onMove}
            onRemove={onRemove}
          />
        ))}
      </ol>
      <FileDropArea
        isDisabled={isReading || isFull}
        onFiles={onAddFiles}
        className={cn(
          "flex flex-col rounded-lg",
          (isReading || isFull) && "opacity-70",
          isReading && "cursor-wait",
        )}
      >
        <span className="flex aspect-3/4 flex-col items-center justify-center gap-2 p-4">
          <PlusIcon aria-hidden className="size-8 text-muted-foreground" />
          <span className="font-semibold">
            {isReading
              ? "Reading the files..."
              : isFull
                ? "Page limit reached"
                : "Add more"}
          </span>
        </span>
        <span className="flex h-11 items-center justify-center px-2 text-muted-foreground">
          Images or PDFs
        </span>
      </FileDropArea>
    </div>
  );
}

function PageCard({
  page,
  index,
  pageCount,
  isDragged,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMove,
  onRemove,
}: {
  page: PickedPage;
  index: number;
  pageCount: number;
  isDragged: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const url = useBlobUrl(page.blob);
  const pageLabel = `Page ${index + 1}`;

  return (
    <li
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", pageLabel);
        onDragStart();
      }}
      onDragOver={(event) => {
        if (!isDragging) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDrop={(event) => {
        if (isDragging) {
          event.preventDefault();
        }
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "flex cursor-grab flex-col overflow-hidden rounded-lg border bg-card transition-opacity active:cursor-grabbing",
        isDragged && "opacity-50 ring-2 ring-curry",
      )}
    >
      <div className="flex aspect-3/4 items-center justify-center bg-muted/50 p-2">
        {url && (
          <Image
            src={url}
            alt={pageLabel}
            width={0}
            height={0}
            sizes="16rem"
            unoptimized
            draggable={false}
            className="h-full w-full object-contain"
          />
        )}
      </div>
      <div className="flex h-11 items-center justify-between gap-1 border-t px-1.5">
        <span className="px-1 font-medium">{pageLabel}</span>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Move page ${index + 1} earlier`}
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Move page ${index + 1} later`}
            disabled={index === pageCount - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <ArrowRightIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Remove page ${index + 1}`}
            onClick={() => onRemove(index)}
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
