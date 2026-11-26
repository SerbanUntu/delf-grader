import { expect, type Page, test } from "@playwright/test";
import {
  createSubmission,
  deleteClass,
  getLoadedImageBox,
  hiddenArea,
  openRedactionStep,
  pageHeight,
  pageWidth,
} from "./helpers";

const className = `E2E redaction ${Date.now()}`;
let classUrl: string | undefined;

test.use({ viewport: { width: 1280, height: 1600 } });

test.afterEach(async ({ page }) => {
  if (classUrl) {
    await deleteClass(page, classUrl, className);
  }
});

async function drawRectangle(
  page: Page,
  imageName: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const box = await getLoadedImageBox(page, imageName);
  await page.mouse.move(
    box.x + box.width * from.x,
    box.y + box.height * from.y,
  );
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to.x, box.y + box.height * to.y, {
    steps: 5,
  });
  await page.mouse.up();
}

async function readPixels(page: Page, jpeg: Buffer) {
  return await page.evaluate(
    async ({ base64, area }) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const bitmap = await createImageBitmap(
        new Blob([bytes], { type: "image/jpeg" }),
      );
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      context.drawImage(bitmap, 0, 0);
      const colorAt = (x: number, y: number) => [
        ...context.getImageData(x, y, 1, 1).data.slice(0, 3),
      ];
      return {
        width: bitmap.width,
        height: bitmap.height,
        hiddenCorner: colorAt(area.x + 2, area.y + 2),
        hiddenCenter: colorAt(
          area.x + area.width / 2,
          area.y + area.height / 2,
        ),
        untouched: colorAt(bitmap.width - 50, bitmap.height - 50),
      };
    },
    { base64: jpeg.toString("base64"), area: hiddenArea },
  );
}

function expectColor(color: number[], expected: number) {
  for (const channel of color) {
    expect(Math.abs(channel - expected)).toBeLessThanOrEqual(12);
  }
}

test("the redaction tool burns the rectangles into the uploaded pages", async ({
  page,
}) => {
  classUrl = await createSubmission(page, className);
  await openRedactionStep(page);

  await drawRectangle(
    page,
    "Page 1",
    { x: 0.1, y: 0.08 },
    { x: 0.55, y: 0.22 },
  );
  await expect(page.getByText("1 rectangle drawn")).toBeVisible();
  await drawRectangle(page, "Page 1", { x: 0.6, y: 0.6 }, { x: 0.8, y: 0.8 });
  await expect(page.getByText("2 rectangles drawn")).toBeVisible();

  await page.getByRole("button", { name: "Rectangle 2" }).click();
  await page.keyboard.press("Delete");
  await expect(page.getByText("1 rectangle drawn")).toBeVisible();
  await page.keyboard.press("Control+z");
  await expect(page.getByText("2 rectangles drawn")).toBeVisible();
  await page.getByRole("button", { name: "Rectangle 2" }).click();
  await page.getByRole("button", { name: "Delete rectangle" }).click();
  await expect(page.getByText("1 rectangle drawn")).toBeVisible();

  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await drawRectangle(page, "Page 2", { x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 });
  await expect(page.getByText("2 rectangles drawn")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("1 rectangle drawn")).toBeVisible();

  const uploads: Buffer[] = [];
  await page.route(/\/api\/storage\/upload/, async (route) => {
    const body = route.request().postDataBuffer();
    if (body) {
      uploads.push(body);
    }
    await route.fulfill({ status: 500 });
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("The images could not be sent")).toBeVisible();
  expect(uploads).toHaveLength(1);
  await expect(page.getByText("1 rectangle drawn")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Transcription/ }),
  ).toBeDisabled();

  const redacted = await readPixels(page, uploads[0]);
  expect([redacted.width, redacted.height]).toEqual([pageWidth, pageHeight]);
  expectColor(redacted.hiddenCorner, 0);
  expectColor(redacted.hiddenCenter, 0);
  expectColor(redacted.untouched, 255);
});
