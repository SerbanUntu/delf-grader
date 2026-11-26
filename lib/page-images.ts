import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import { formatNumber, maxPageCount, maxUploadSize } from "./format";

const maxPageSide = 2400;
const jpegQuality = 0.9;
const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const pdfType = "application/pdf";

export const acceptedFileTypes = [...imageTypes, pdfType].join(",");

/**
 * An error about the files picked by the teacher, with a message that can be shown to them.
 */
export class PageError extends Error {}

/**
 * A rectangle drawn over a page, with its position and size given as fractions of the page's width and height.
 */
export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function sortByName(files: File[]): File[] {
  return files.toSorted((first, second) =>
    first.name.localeCompare(second.name, undefined, { numeric: true }),
  );
}

function getScale(width: number, height: number): number {
  return Math.min(1, maxPageSide / Math.max(width, height));
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new PageError("A page could not be read.")),
      type,
      quality,
    );
  });
}

async function checkImage(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
  } catch {
    throw new PageError(`"${file.name}" could not be read as an image.`);
  }
}

async function openPdf(file: File): Promise<PDFDocumentLoadingTask> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  try {
    await loadingTask.promise;
  } catch {
    await loadingTask.destroy();
    throw new PageError(`"${file.name}" could not be read as a PDF.`);
  }
  return loadingTask;
}

async function renderPdf(pdf: PDFDocumentProxy): Promise<Blob[]> {
  const pages: Blob[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const size = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({
      scale: maxPageSide / Math.max(size.width, size.height),
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;
    pages.push(await canvasToBlob(canvas, "image/jpeg", jpegQuality));
    page.cleanup();
  }
  return pages;
}

/**
 * Reads the files picked by the teacher as new pages of a submission, turning each page of a PDF into an image.
 *
 * @param files Images and PDFs, in any mix.
 * @param currentPages The pages the submission already has, which count towards the limits.
 * @returns The new page images in order. Files are sorted by name, and the pages of a PDF take its place.
 * @throws A PageError if the files cannot be used, for example when there would be too many pages.
 */
export async function readPageFiles(
  files: File[],
  currentPages: Blob[] = [],
): Promise<Blob[]> {
  if (files.length === 0) {
    throw new PageError("Pick at least one file.");
  }
  const totalSize = [...currentPages, ...files].reduce(
    (sum, file) => sum + file.size,
    0,
  );
  if (totalSize > maxUploadSize) {
    throw new PageError(
      `The pages would take up ${formatNumber(totalSize / 1024 / 1024, 1)} MB, but a submission can take up at most ${maxUploadSize / 1024 / 1024} MB.`,
    );
  }
  const unsupported = files.find(
    (file) => file.type !== pdfType && !imageTypes.includes(file.type),
  );
  if (unsupported) {
    throw new PageError(
      `"${unsupported.name}" is not supported. Pick JPEG, PNG or WebP images, or PDFs.`,
    );
  }

  const sorted = sortByName(files);
  const pdfs = new Map<File, PDFDocumentLoadingTask>();
  try {
    let pageCount = currentPages.length;
    for (const file of sorted) {
      if (file.type === pdfType) {
        const loadingTask = await openPdf(file);
        pdfs.set(file, loadingTask);
        pageCount += (await loadingTask.promise).numPages;
      } else {
        await checkImage(file);
        pageCount += 1;
      }
    }
    if (pageCount > maxPageCount) {
      throw new PageError(
        `The submission would have ${pageCount} pages, but it can have at most ${maxPageCount}.`,
      );
    }

    const pages: Blob[] = [];
    for (const file of sorted) {
      const loadingTask = pdfs.get(file);
      if (loadingTask) {
        pages.push(...(await renderPdf(await loadingTask.promise)));
      } else {
        pages.push(file);
      }
    }
    return pages;
  } finally {
    for (const loadingTask of pdfs.values()) {
      await loadingTask.destroy();
    }
  }
}

/**
 * Draws a page image again with black rectangles burned into its pixels and encodes it as a JPEG, which removes its metadata such as GPS location.
 *
 * @param page The page image.
 * @param rectangles The rectangles that hide personal information.
 * @returns The JPEG image, shrunk if it is very large.
 */
export async function encodePageAsJpeg(
  page: Blob,
  rectangles: Rectangle[] = [],
): Promise<Blob> {
  const bitmap = await createImageBitmap(page, {
    imageOrientation: "from-image",
  });
  const scale = getScale(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new PageError("A page could not be read.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  context.fillStyle = "#000000";
  for (const rectangle of rectangles) {
    const left = Math.floor(rectangle.x * canvas.width);
    const top = Math.floor(rectangle.y * canvas.height);
    const right = Math.ceil((rectangle.x + rectangle.width) * canvas.width);
    const bottom = Math.ceil((rectangle.y + rectangle.height) * canvas.height);
    context.fillRect(left, top, right - left, bottom - top);
  }
  return await canvasToBlob(canvas, "image/jpeg", jpegQuality);
}
