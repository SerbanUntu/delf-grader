"use client";

import { ViewHorizontalIcon, ViewVerticalIcon } from "@radix-ui/react-icons";
import { type ReactNode, useState, useSyncExternalStore } from "react";
import type { Layout } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  readStorageItem,
  subscribeToStorage,
  writeStorageItem,
} from "@/lib/local-storage";

type Direction = "horizontal" | "vertical";

const directionStorageName = "side-by-side:direction";
const sizesStorageName = "side-by-side:sizes";
const wideScreenQuery = "(min-width: 768px)";
const minSideWidth = 300;

function readDirection(): Direction {
  return readStorageItem(directionStorageName) === "vertical"
    ? "vertical"
    : "horizontal";
}

function useDirection(): Direction {
  return useSyncExternalStore(
    subscribeToStorage,
    readDirection,
    () => "horizontal",
  );
}

function useIsWideScreen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      const query = window.matchMedia(wideScreenQuery);
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    },
    () => window.matchMedia(wideScreenQuery).matches,
    () => true,
  );
}

function readSizes(): Layout | undefined {
  try {
    const sizes: unknown = JSON.parse(
      readStorageItem(sizesStorageName) ?? "null",
    );
    if (
      typeof sizes === "object" &&
      sizes !== null &&
      "images" in sizes &&
      "step" in sizes &&
      typeof sizes.images === "number" &&
      typeof sizes.step === "number"
    ) {
      return { images: sizes.images, step: sizes.step };
    }
  } catch {}
  return undefined;
}

/**
 * The button in the toolbar of the submission images that switches between showing the two sides side by side and one above the other.
 */
export function SideBySideButton() {
  const direction = useDirection();
  const isHorizontal = direction === "horizontal";
  const label = isHorizontal ? "Show one above the other" : "Show side by side";

  return (
    <Button
      variant="outline"
      size="icon"
      className="max-md:hidden"
      aria-label={label}
      title={label}
      onClick={() =>
        writeStorageItem(
          directionStorageName,
          isHorizontal ? "vertical" : "horizontal",
        )
      }
    >
      {isHorizontal ? (
        <ViewHorizontalIcon className="size-5" />
      ) : (
        <ViewVerticalIcon className="size-5" />
      )}
    </Button>
  );
}

/**
 * Shows the submission images and the content of a step side by side with a divider that resizes them, or one above the other.
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
  const direction = useDirection();
  const isWideScreen = useIsWideScreen();

  if (direction === "vertical" || !isWideScreen) {
    return (
      <div className="grid gap-6">
        <div className="min-w-0">{images}</div>
        <div className="min-w-0">{children}</div>
      </div>
    );
  }

  return <ResizableSides images={images}>{children}</ResizableSides>;
}

function ResizableSides({
  images,
  children,
}: {
  images: ReactNode;
  children: ReactNode;
}) {
  const [savedSizes] = useState(readSizes);

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      defaultLayout={savedSizes}
      onLayoutChanged={(_, { isUserInteraction, requestedLayout }) => {
        if (isUserInteraction) {
          writeStorageItem(sizesStorageName, JSON.stringify(requestedLayout));
        }
      }}
    >
      <ResizablePanel
        id="images"
        defaultSize="50"
        minSize={minSideWidth}
        className="pr-3"
      >
        {images}
      </ResizablePanel>
      <ResizableHandle
        withHandle
        aria-label="Resize the two sides"
        title="Drag to resize the two sides"
      />
      <ResizablePanel
        id="step"
        defaultSize="50"
        minSize={minSideWidth}
        className="pb-1 pl-3"
      >
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
