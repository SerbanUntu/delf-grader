"use client";

import {
  MagnifyingGlassIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@radix-ui/react-icons";
import {
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  readStorageItem,
  subscribeToStorage,
  writeStorageItem,
} from "@/lib/local-storage";
import { cn } from "@/lib/utils";

const minZoom = 0.5;
const maxZoom = 4;
const zoomLevels = [0.5, 0.75, 1, 1.5, 2, 3, 4];
const wheelSpeed = 0.002;
const lensSize = 200;
const lensScale = 2.5;
const isMagnifierOnByDefault = { viewer: true, redaction: false };

export type ZoomScreen = keyof typeof isMagnifierOnByDefault;

type Anchor = {
  fractionX: number;
  fractionY: number;
  viewportX: number;
  viewportY: number;
};

export type PageZoom = {
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  viewportRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  zoomAround: (zoom: number, anchor: Anchor | undefined) => void;
  zoomBy: (factor: number, anchor: Anchor | undefined) => void;
  anchorAt: (clientX: number, clientY: number) => Anchor | undefined;
  magnifier: { isOn: boolean; setIsOn: (isOn: boolean) => void };
};

function clampZoom(zoom: number): number {
  return Math.min(maxZoom, Math.max(minZoom, zoom));
}

function scrollToAnchor(
  viewport: HTMLDivElement | null,
  content: HTMLDivElement | null,
  anchor: Anchor | undefined,
) {
  if (!anchor || !viewport || !content) {
    return;
  }
  viewport.scrollLeft =
    content.offsetLeft +
    anchor.fractionX * content.offsetWidth -
    anchor.viewportX;
  viewport.scrollTop =
    content.offsetTop +
    anchor.fractionY * content.offsetHeight -
    anchor.viewportY;
}

function useMagnifier(screen: ZoomScreen) {
  const storageName = `delf-grader:magnifier:${screen}`;
  const isOnByDefault = isMagnifierOnByDefault[screen];
  const isOn = useSyncExternalStore(
    subscribeToStorage,
    () => {
      const stored = readStorageItem(storageName);
      return stored === null ? isOnByDefault : stored === "on";
    },
    () => isOnByDefault,
  );

  function setIsOn(value: boolean) {
    writeStorageItem(storageName, value ? "on" : "off");
  }

  return { isOn, setIsOn };
}

/**
 * Keeps the zoom level and the magnifier choice of a view of student pages, shared between its toolbar buttons and its zoom area.
 *
 * @param screen The screen showing the pages, which has its own magnifier choice.
 * @returns The zoom level, the magnifier choice and the functions that change them.
 */
export function usePageZoom(screen: ZoomScreen): PageZoom {
  const magnifier = useMagnifier(screen);
  const [view, setView] = useState<{ zoom: number; anchor?: Anchor }>({
    zoom: 1,
  });
  const zoomRef = useRef(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { zoom } = view;

  useLayoutEffect(() => {
    scrollToAnchor(viewportRef.current, contentRef.current, view.anchor);
  }, [view]);

  function anchorAt(clientX: number, clientY: number): Anchor | undefined {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) {
      return undefined;
    }
    const viewportBox = viewport.getBoundingClientRect();
    const contentBox = content.getBoundingClientRect();
    if (contentBox.width === 0 || contentBox.height === 0) {
      return undefined;
    }
    return {
      fractionX: (clientX - contentBox.left) / contentBox.width,
      fractionY: (clientY - contentBox.top) / contentBox.height,
      viewportX: clientX - viewportBox.left,
      viewportY: clientY - viewportBox.top,
    };
  }

  function centerAnchor(): Anchor | undefined {
    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }
    const box = viewport.getBoundingClientRect();
    return anchorAt(
      box.left + viewport.clientWidth / 2,
      box.top + viewport.clientHeight / 2,
    );
  }

  function zoomAround(next: number, anchor: Anchor | undefined) {
    const clamped = clampZoom(next);
    if (clamped === zoomRef.current) {
      scrollToAnchor(viewportRef.current, contentRef.current, anchor);
      return;
    }
    zoomRef.current = clamped;
    setView({ zoom: clamped, anchor });
  }

  const nextLevel = zoomLevels.find((level) => level > zoom + 0.001);
  const previousLevel = zoomLevels.findLast((level) => level < zoom - 0.001);

  return {
    zoom,
    canZoomIn: nextLevel !== undefined,
    canZoomOut: previousLevel !== undefined,
    zoomIn: () => {
      if (nextLevel !== undefined) {
        zoomAround(nextLevel, centerAnchor());
      }
    },
    zoomOut: () => {
      if (previousLevel !== undefined) {
        zoomAround(previousLevel, centerAnchor());
      }
    },
    resetZoom: () => zoomAround(1, centerAnchor()),
    viewportRef,
    contentRef,
    zoomAround,
    zoomBy: (factor, anchor) => zoomAround(zoomRef.current * factor, anchor),
    anchorAt,
    magnifier,
  };
}

/**
 * The zoom out, zoom in, reset and magnifier buttons of a view of student pages.
 *
 * @param zoom The zoom of the view, from usePageZoom.
 */
export function ZoomControls({ zoom }: { zoom: PageZoom }) {
  const { magnifier } = zoom;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        aria-label="Zoom out"
        title="Zoom out"
        disabled={!zoom.canZoomOut}
        onClick={zoom.zoomOut}
      >
        <ZoomOutIcon className="size-5" />
      </Button>
      <span className="w-14 text-center font-medium tabular-nums">
        {Math.round(zoom.zoom * 100)}%
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label="Zoom in"
        title="Zoom in"
        disabled={!zoom.canZoomIn}
        onClick={zoom.zoomIn}
      >
        <ZoomInIcon className="size-5" />
      </Button>
      <Button
        variant="outline"
        disabled={zoom.zoom === 1}
        onClick={zoom.resetZoom}
        title="Reset the zoom to 100%"
      >
        Reset
      </Button>
      <Toggle
        variant="outline"
        className="size-9 px-0 pointer-coarse:hidden"
        aria-label="Magnifier"
        title={
          magnifier.isOn ? "Turn the magnifier off" : "Turn the magnifier on"
        }
        pressed={magnifier.isOn}
        onPressedChange={magnifier.setIsOn}
      >
        <MagnifyingGlassIcon className="size-5" />
      </Toggle>
    </div>
  );
}

function distanceBetween(first: Touch, second: Touch): number {
  return Math.hypot(
    first.clientX - second.clientX,
    first.clientY - second.clientY,
  );
}

function middleOf(first: Touch, second: Touch) {
  return {
    x: (first.clientX + second.clientX) / 2,
    y: (first.clientY + second.clientY) / 2,
  };
}

/**
 * A container of fixed size showing student pages that can be zoomed with Ctrl + mouse wheel or by pinching, moved around and looked at through a magnifier.
 *
 * @param zoom The zoom of the view, from usePageZoom.
 * @param children The pages, laid out one under the other.
 * @param magnified A copy of the pages without any buttons, shown inside the magnifier.
 * @param dragToMove Whether dragging with the mouse moves around the pages.
 * @param onScroll Called when the pages are scrolled.
 * @param className Sets the size of the container.
 */
export function ZoomArea({
  zoom,
  children,
  magnified,
  dragToMove = true,
  onScroll,
  className,
}: {
  zoom: PageZoom;
  children: ReactNode;
  magnified: ReactNode;
  dragToMove?: boolean;
  onScroll?: () => void;
  className?: string;
}) {
  const { magnifier } = zoom;
  const frameRef = useRef<HTMLElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const lensContentRef = useRef<HTMLDivElement>(null);
  const cursor = useRef<{ x: number; y: number }>(undefined);
  const drag = useRef<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  }>(undefined);
  const pinch = useRef<{
    distance: number;
    zoom: number;
    anchor: Anchor | undefined;
  }>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const { viewportRef, contentRef } = zoom;

  function hideLens() {
    if (lensRef.current) {
      lensRef.current.style.display = "none";
    }
  }

  function updateLens() {
    const frame = frameRef.current;
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const lens = lensRef.current;
    const lensContent = lensContentRef.current;
    const point = cursor.current;
    if (
      !frame ||
      !viewport ||
      !content ||
      !lens ||
      !lensContent ||
      !point ||
      drag.current
    ) {
      hideLens();
      return;
    }
    const viewportBox = viewport.getBoundingClientRect();
    const contentBox = content.getBoundingClientRect();
    const isInside =
      point.x >= Math.max(viewportBox.left, contentBox.left) &&
      point.x <= Math.min(viewportBox.right, contentBox.right) &&
      point.y >= Math.max(viewportBox.top, contentBox.top) &&
      point.y <= Math.min(viewportBox.bottom, contentBox.bottom);
    if (!isInside) {
      hideLens();
      return;
    }
    const frameBox = frame.getBoundingClientRect();
    lens.style.display = "block";
    lens.style.transform = `translate(${point.x - frameBox.left - lensSize / 2}px, ${point.y - frameBox.top - lensSize / 2}px)`;
    lensContent.style.width = `${contentBox.width}px`;
    lensContent.style.transform = `translate(${lensSize / 2 - (point.x - contentBox.left) * lensScale}px, ${lensSize / 2 - (point.y - contentBox.top) * lensScale}px) scale(${lensScale})`;
  }

  useLayoutEffect(() => {
    updateLens();
  });

  const handleWheel = useEffectEvent((event: WheelEvent) => {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    const lineHeight = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
    zoom.zoomBy(
      Math.exp(-event.deltaY * lineHeight * wheelSpeed),
      zoom.anchorAt(event.clientX, event.clientY),
    );
  });

  const handleTouchStart = useEffectEvent((event: TouchEvent) => {
    if (event.touches.length !== 2) {
      pinch.current = undefined;
      return;
    }
    const [first, second] = [event.touches[0], event.touches[1]];
    const middle = middleOf(first, second);
    cursor.current = undefined;
    hideLens();
    pinch.current = {
      distance: distanceBetween(first, second),
      zoom: zoom.zoom,
      anchor: zoom.anchorAt(middle.x, middle.y),
    };
  });

  const handleTouchMove = useEffectEvent((event: TouchEvent) => {
    const start = pinch.current;
    const viewport = viewportRef.current;
    if (!start || !viewport || event.touches.length !== 2) {
      return;
    }
    if (event.cancelable) {
      event.preventDefault();
    }
    const [first, second] = [event.touches[0], event.touches[1]];
    const middle = middleOf(first, second);
    const box = viewport.getBoundingClientRect();
    zoom.zoomAround(
      (start.zoom * distanceBetween(first, second)) / start.distance,
      start.anchor && {
        ...start.anchor,
        viewportX: middle.x - box.left,
        viewportY: middle.y - box.top,
      },
    );
  });

  const handleTouchEnd = useEffectEvent((event: TouchEvent) => {
    if (event.touches.length < 2) {
      pinch.current = undefined;
    }
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const options = { passive: false };
    viewport.addEventListener("wheel", handleWheel, options);
    viewport.addEventListener("touchstart", handleTouchStart, options);
    viewport.addEventListener("touchmove", handleTouchMove, options);
    viewport.addEventListener("touchend", handleTouchEnd);
    viewport.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      viewport.removeEventListener("wheel", handleWheel);
      viewport.removeEventListener("touchstart", handleTouchStart);
      viewport.removeEventListener("touchmove", handleTouchMove);
      viewport.removeEventListener("touchend", handleTouchEnd);
      viewport.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [viewportRef]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (
      !dragToMove ||
      !viewport ||
      event.pointerType !== "mouse" ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    setIsDragging(true);
    hideLens();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    const start = drag.current;
    if (start && viewport) {
      viewport.scrollLeft = start.scrollLeft - (event.clientX - start.x);
      viewport.scrollTop = start.scrollTop - (event.clientY - start.y);
      return;
    }
    if (event.pointerType !== "mouse") {
      cursor.current = undefined;
      hideLens();
      return;
    }
    cursor.current = { x: event.clientX, y: event.clientY };
    updateLens();
  }

  function stopDragging() {
    if (drag.current) {
      drag.current = undefined;
      setIsDragging(false);
      updateLens();
    }
  }

  return (
    <section
      ref={frameRef}
      aria-label="Student pages"
      className={cn("relative overflow-hidden", className)}
    >
      <div
        ref={viewportRef}
        role="presentation"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={() => {
          cursor.current = undefined;
          hideLens();
        }}
        onScroll={() => {
          updateLens();
          onScroll?.();
        }}
        className={cn(
          "relative size-full touch-pan-x touch-pan-y overflow-auto p-4 select-none",
          dragToMove && (isDragging ? "cursor-grabbing" : "cursor-grab"),
        )}
      >
        <div
          ref={contentRef}
          className="mx-auto grid gap-4"
          style={{ width: `${zoom.zoom * 100}%` }}
        >
          {children}
        </div>
      </div>
      {magnifier.isOn && (
        <div
          ref={lensRef}
          aria-hidden
          data-testid="magnifier"
          className="pointer-events-none absolute top-0 left-0 z-10 hidden overflow-hidden rounded-full bg-muted shadow-xl ring-2 ring-black/40"
          style={{ width: lensSize, height: lensSize }}
        >
          <div
            ref={lensContentRef}
            inert
            className="absolute top-0 left-0 grid origin-top-left gap-4"
          >
            {magnified}
          </div>
        </div>
      )}
    </section>
  );
}
