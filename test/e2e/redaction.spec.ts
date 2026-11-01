import { expect, type Page, test } from "@playwright/test";

const className = `E2E redaction ${Date.now()}`;
const pageWidth = 800;
const pageHeight = 1000;
const hiddenArea = { x: 100, y: 100, width: 300, height: 100 };
let classUrl: string | undefined;

test.use({ viewport: { width: 1280, height: 1600 } });

test.afterEach(async ({ page }) => {
  if (!classUrl) {
    return;
  }
  await page.goto(classUrl);
  await page
    .getByRole("button", { name: `Actions for ${className}`, exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Delete class" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
});

async function createSubmission(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New class" }).click();
  await page.getByPlaceholder("Clasa a IX-a Z").fill(className);
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/classes\//);
  classUrl = page.url();

  await page.getByRole("button", { name: "New session" }).click();
  await page.getByLabel("Rubric").click();
  await page.getByRole("option", { name: "New B1" }).click();
  await page.getByLabel("Exam question").fill("Vous écrivez une lettre.");
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/sessions\//);

  await page.getByRole("button", { name: "Add submission" }).click();
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/submissions\//);
}

async function createPageImage(page: Page): Promise<Buffer> {
  const base64 = await page.evaluate(
    ({ width, height, area }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#ff0000";
      context.fillRect(area.x, area.y, area.width, area.height);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    { width: pageWidth, height: pageHeight, area: hiddenArea },
  );
  return Buffer.from(base64, "base64");
}

async function drawRectangle(
  page: Page,
  imageName: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const image = page.getByRole("img", { name: imageName });
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBeGreaterThan(0);
  const box = await image.boundingBox();
  if (!box) {
    throw new Error(`${imageName} is not visible.`);
  }
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
  await createSubmission(page);

  const image = await createPageImage(page);
  await page.locator('input[type="file"]').setInputFiles([
    { name: "page-1.png", mimeType: "image/png", buffer: image },
    { name: "page-2.png", mimeType: "image/png", buffer: image },
  ]);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save (no redactions)" }),
  ).toBeVisible();

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

  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByText("150%")).toBeVisible();
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect(page.getByText("100%")).toBeVisible();

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
