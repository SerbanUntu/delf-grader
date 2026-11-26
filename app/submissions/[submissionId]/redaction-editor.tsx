"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cross2Icon,
  HandIcon,
  ResetIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { PageImage, type ViewerPage } from "@/components/page-viewer";
import { usePageZoom, ZoomArea, ZoomControls } from "@/components/page-zoom";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import type { Rectangle } from "@/lib/page-images";
import { cn } from "@/lib/utils";

const minimumRectangleSize = 6;

export type DrawnRectangle = Rectangle & { id: number };

type Point = { x: number; y: number };

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toRectangle(start: Point, end: Point): Rectangle {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

function toStyle(rectangle: Rectangle) {
  return {
    left: `${rectangle.x * 100}%`,
    top: `${rectangle.y * 100}%`,
    width: `${rectangle.width * 100}%`,
    height: `${rectangle.height * 100}%`,
  };
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * Lets the teacher draw black rectangles over the pages of a submission to hide personal information, with undo, deleting and zoom.
 *
 * @param pages The page images in order.
 * @param rectangles The rectangles drawn on each page, in the order of the pages.
 * @param onChange Called with the new rectangles when the teacher draws, deletes or undoes.
 * @param disabled Whether the rectangles cannot be changed, for example while saving.
 * @param badge A short label shown above the pages, such as "Not saved".
 */
export function RedactionEditor({
  pages,
  rectangles,
  onChange,
  disabled = false,
  badge,
}: {
  pages: ViewerPage[];
  rectangles: DrawnRectangle[][];
  onChange: (rectangles: DrawnRectangle[][]) => void;
  disabled?: boolean;
  badge?: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const [pageIndex, setPageIndex] = useState(0);
  const zoom = usePageZoom("redaction");
  const [isMoving, setIsMoving] = useState(false);
  const [selectedId, setSelectedId] = useState<number>();
  const [draft, setDraft] = useState<{ start: Point; end: Point }>();
  const [history, setHistory] = useState<DrawnRectangle[][][]>([]);

  const page = pages[pageIndex];
  const pageRectangles = rectangles[pageIndex] ?? [];
  const canDelete = !disabled && selectedId !== undefined;
  const canUndo = !disabled && history.length > 0;

  function goToPage(index: number) {
    setPageIndex(index);
    setSelectedId(undefined);
    setDraft(undefined);
    zoom.viewportRef.current?.scrollTo({ top: 0, left: 0 });
  }

  function changePage(
    update: (rectangles: DrawnRectangle[]) => DrawnRectangle[],
  ) {
    setHistory([...history, rectangles]);
    onChange(
      rectangles.map((current, index) =>
        index === pageIndex ? update(current) : current,
      ),
    );
  }

  function deleteSelected() {
    if (!canDelete) {
      return;
    }
    changePage((current) =>
      current.filter((rectangle) => rectangle.id !== selectedId),
    );
    setSelectedId(undefined);
  }

  function undo() {
    const previous = history.at(-1);
    if (!canUndo || !previous) {
      return;
    }
    const changedIndex = previous.findIndex(
      (current, index) => current !== rectangles[index],
    );
    setHistory(history.slice(0, -1));
    onChange(previous);
    if (changedIndex >= 0 && changedIndex !== pageIndex) {
      goToPage(changedIndex);
    } else {
      setSelectedId(undefined);
    }
  }

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const isInEditor =
      event.target === document.body ||
      (event.target instanceof Node && rootRef.current?.contains(event.target));
    if (!isInEditor || isTyping(event.target)) {
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      if (canDelete) {
        event.preventDefault();
        deleteSelected();
      }
    } else if (event.key === "Escape") {
      setSelectedId(undefined);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toPoint(event: PointerEvent<HTMLDivElement>): Point {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - box.left) / box.width),
      y: clamp((event.clientY - box.top) / box.height),
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      setDraft(undefined);
      return;
    }
    if (disabled || event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(undefined);
    const point = toPoint(event);
    setDraft({ start: point, end: point });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draft) {
      setDraft({ ...draft, end: toPoint(event) });
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!draft) {
      return;
    }
    const rectangle = toRectangle(draft.start, toPoint(event));
    const box = event.currentTarget.getBoundingClientRect();
    setDraft(undefined);
    if (
      rectangle.width * box.width >= minimumRectangleSize &&
      rectangle.height * box.height >= minimumRectangleSize
    ) {
      const id = nextId.current++;
      changePage((current) => [...current, { ...rectangle, id }]);
    }
  }

  const selectedRectangle = pageRectangles.find(
    (rectangle) => rectangle.id === selectedId,
  );
  const draftRectangle = draft && toRectangle(draft.start, draft.end);

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-xl border bg-muted/50"
    >
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b bg-card px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="font-medium">
            Page {pageIndex + 1} of {pages.length}
          </span>
          {badge}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" disabled={!canUndo} onClick={undo}>
              <ResetIcon className="size-4" />
              Undo
            </Button>
            <Button
              variant="outline"
              disabled={!canDelete}
              onClick={deleteSelected}
            >
              <TrashIcon className="size-4" />
              Delete
            </Button>
            <Toggle
              variant="outline"
              className="gap-2"
              title="When on, dragging moves around the page instead of drawing"
              pressed={isMoving}
              onPressedChange={(pressed) => {
                setIsMoving(pressed);
                setDraft(undefined);
              }}
            >
              <HandIcon className="size-4" />
              Move
            </Toggle>
          </div>
          <ZoomControls zoom={zoom} />
          {pages.length > 1 && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={pageIndex === 0}
                onClick={() => goToPage(pageIndex - 1)}
              >
                <ChevronLeftIcon className="size-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={pageIndex >= pages.length - 1}
                onClick={() => goToPage(pageIndex + 1)}
              >
                <ChevronRightIcon className="size-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <ZoomArea
        zoom={zoom}
        dragToMove={isMoving}
        className="h-[75vh] min-h-80"
        magnified={
          <div className="relative">
            <PageImage key={page.id} page={page} alt="" />
            {pageRectangles.map((rectangle) => (
              <div
                key={rectangle.id}
                className="absolute bg-black"
                style={toStyle(rectangle)}
              />
            ))}
            {draftRectangle && (
              <div
                className="absolute bg-black/80"
                style={toStyle(draftRectangle)}
              />
            )}
          </div>
        }
      >
        <div className="relative">
          <PageImage key={page.id} page={page} alt={`Page ${pageIndex + 1}`} />
          <div
            role="presentation"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => setDraft(undefined)}
            className={cn(
              "absolute inset-0 touch-none select-none",
              disabled ? "cursor-not-allowed" : "cursor-crosshair",
              isMoving && "pointer-events-none",
            )}
          >
            {pageRectangles.map((rectangle, index) => (
              <button
                key={rectangle.id}
                type="button"
                aria-label={`Rectangle ${index + 1}`}
                aria-pressed={rectangle.id === selectedId}
                disabled={disabled}
                style={toStyle(rectangle)}
                onPointerDown={(event) => event.stopPropagation()}
                onFocus={() => setSelectedId(rectangle.id)}
                onClick={() => setSelectedId(rectangle.id)}
                className={cn(
                  "absolute cursor-pointer bg-black outline-none disabled:cursor-not-allowed",
                  rectangle.id === selectedId &&
                    "ring-2 ring-curry ring-offset-2",
                )}
              />
            ))}
            {selectedRectangle && !disabled && (
              <Button
                size="icon"
                variant="destructive"
                aria-label="Delete rectangle"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={deleteSelected}
                style={{
                  left: `${(selectedRectangle.x + selectedRectangle.width) * 100}%`,
                  top: `${selectedRectangle.y * 100}%`,
                }}
                className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md"
              >
                <Cross2Icon className="size-4" />
              </Button>
            )}
            {draftRectangle && (
              <div
                className="pointer-events-none absolute bg-black/80"
                style={toStyle(draftRectangle)}
              />
            )}
          </div>
        </div>
      </ZoomArea>
    </div>
  );
}
