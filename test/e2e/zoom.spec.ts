import { expect, type Page, test } from "@playwright/test";
import {
  createSubmission,
  deleteClass,
  getLoadedImageBox,
  openRedactionStep,
} from "./helpers";

let className: string;
let classUrl: string | undefined;

test.use({ viewport: { width: 1280, height: 900 } });

test.beforeEach(async ({ page }) => {
  className = `E2E zoom ${Date.now()}`;
  classUrl = await createSubmission(page, className);
  await openRedactionStep(page);
});

test.afterEach(async ({ page }) => {
  if (classUrl) {
    await deleteClass(page, classUrl, className);
  }
});

function zoomLevel(page: Page) {
  return page.getByText(/^\d+%$/);
}

async function readZoomLevel(page: Page): Promise<number> {
  return Number.parseInt((await zoomLevel(page).textContent()) ?? "", 10);
}

async function dragMouse(
  page: Page,
  from: { x: number; y: number },
  by: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + by.x, from.y + by.y, { steps: 5 });
  await page.mouse.up();
}

test("zooming only changes what is inside the image container", async ({
  page,
}) => {
  const container = page.getByRole("region", { name: "Student pages" });
  const containerBox = await container.boundingBox();
  const toolbarBox = await page
    .getByRole("button", { name: "Undo" })
    .boundingBox();
  const imageBox = await getLoadedImageBox(page, "Page 1");
  await expect(zoomLevel(page)).toHaveText("100%");
  await expect(page.getByRole("button", { name: "Reset" })).toBeDisabled();

  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(zoomLevel(page)).toHaveText("150%");
  const zoomedBox = await getLoadedImageBox(page, "Page 1");
  expect(zoomedBox.width).toBeCloseTo(imageBox.width * 1.5, 0);

  for (const level of ["200%", "300%", "400%"]) {
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect(zoomLevel(page)).toHaveText(level);
  }
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeDisabled();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(zoomLevel(page)).toHaveText("100%");
  for (const level of ["75%", "50%"]) {
    await page.getByRole("button", { name: "Zoom out" }).click();
    await expect(zoomLevel(page)).toHaveText(level);
  }
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeDisabled();
  await page.getByRole("button", { name: "Reset" }).click();

  const cursor = {
    x: imageBox.x + imageBox.width * 0.3,
    y: imageBox.y + imageBox.height * 0.2,
  };
  const spotUnderCursor = () =>
    page.getByRole("img", { name: "Page 1" }).evaluate((element, point) => {
      const box = element.getBoundingClientRect();
      return {
        x: (point.x - box.left) / box.width,
        y: (point.y - box.top) / box.height,
      };
    }, cursor);
  await page.mouse.move(cursor.x, cursor.y);
  const spotBefore = await spotUnderCursor();
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -300);
  await page.keyboard.up("Control");
  await expect.poll(() => readZoomLevel(page)).toBeGreaterThan(150);
  const spotAfter = await spotUnderCursor();
  expect(spotAfter.x).toBeCloseTo(spotBefore.x, 2);
  expect(spotAfter.y).toBeCloseTo(spotBefore.y, 2);

  expect(await container.boundingBox()).toEqual(containerBox);
  expect(
    await page.getByRole("button", { name: "Undo" }).boundingBox(),
  ).toEqual(toolbarBox);

  const level = await zoomLevel(page).textContent();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await expect(zoomLevel(page)).toHaveText(level ?? "");
});

test("the magnifier is off by default on the redaction screen and the choice is remembered", async ({
  page,
}) => {
  const magnifierButton = page.getByRole("button", { name: "Magnifier" });
  const lens = page.getByTestId("magnifier");
  const imageBox = await getLoadedImageBox(page, "Page 1");
  const cursor = { x: imageBox.x + imageBox.width / 2, y: imageBox.y + 150 };

  await expect(magnifierButton).toHaveAttribute("aria-pressed", "false");
  await page.mouse.move(cursor.x, cursor.y);
  await expect(lens).toHaveCount(0);

  await magnifierButton.click();
  await page.mouse.move(cursor.x, cursor.y);
  await expect(lens).toBeVisible();
  const lensBox = await lens.boundingBox();
  expect(lensBox?.width).toBeCloseTo(200, 0);
  expect((lensBox?.x ?? 0) + (lensBox?.width ?? 0) / 2).toBeCloseTo(
    cursor.x,
    0,
  );
  expect((lensBox?.y ?? 0) + (lensBox?.height ?? 0) / 2).toBeCloseTo(
    cursor.y,
    0,
  );

  await dragMouse(page, cursor, { x: 100, y: 60 });
  await expect(page.getByText("1 rectangle drawn")).toBeVisible();

  await page.getByRole("heading", { name: "Redaction" }).hover();
  await expect(lens).toBeHidden();

  await page.reload();
  await expect(magnifierButton).toHaveAttribute("aria-pressed", "true");
  await magnifierButton.click();
  await expect(magnifierButton).toHaveAttribute("aria-pressed", "false");
  await expect(lens).toHaveCount(0);
});

test("the page can be moved around by dragging in Move mode and zoomed by pinching", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(zoomLevel(page)).toHaveText("200%");
  const container = page.getByRole("region", { name: "Student pages" });
  const containerBox = await container.boundingBox();
  if (!containerBox) {
    throw new Error("The image container is not visible.");
  }
  const center = {
    x: containerBox.x + containerBox.width / 2,
    y: containerBox.y + containerBox.height / 2,
  };

  await page.getByRole("button", { name: "Move" }).click();
  const before = await getLoadedImageBox(page, "Page 1");
  await dragMouse(page, center, { x: -100, y: -150 });
  const after = await getLoadedImageBox(page, "Page 1");
  expect(after.x).toBeCloseTo(before.x - 100, 0);
  expect(after.y).toBeCloseTo(before.y - 150, 0);
  await expect(page.getByText("0 rectangles drawn")).toBeVisible();

  await page.getByRole("button", { name: "Move" }).click();
  await dragMouse(page, center, { x: 100, y: 60 });
  await expect(page.getByText("1 rectangle drawn")).toBeVisible();

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(zoomLevel(page)).toHaveText("100%");
  const browser = await page.context().newCDPSession(page);
  const touches = (spread: number) => [
    { id: 1, x: center.x - spread, y: center.y },
    { id: 2, x: center.x + spread, y: center.y },
  ];
  await browser.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: touches(50),
  });
  for (let spread = 60; spread <= 150; spread += 10) {
    await browser.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: touches(spread),
    });
  }
  await browser.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect.poll(() => readZoomLevel(page)).toBeGreaterThanOrEqual(250);
  await expect(page.getByText("1 rectangle drawn")).toBeVisible();
});
