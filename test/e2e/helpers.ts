import { expect, type Page } from "@playwright/test";

export const pageWidth = 800;
export const pageHeight = 1000;
export const hiddenArea = { x: 100, y: 100, width: 300, height: 100 };

/**
 * Creates a class holding a session with one empty submission, and opens the submission page.
 *
 * @param page The browser page.
 * @param className The name of the new class.
 * @param studentName The student name entered for the submission, or undefined to leave it empty.
 * @returns The URL of the class page, used to delete the class afterwards.
 */
export async function createSubmission(
  page: Page,
  className: string,
  studentName?: string,
): Promise<string> {
  await page.goto("/");
  await page.getByRole("button", { name: "New class" }).click();
  await page.getByPlaceholder("Clasa a IX-a Z").fill(className);
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/classes\//);
  const classUrl = page.url();

  await page.getByRole("button", { name: "New session" }).click();
  await page.getByLabel("Rubric").click();
  await page.getByRole("option", { name: "New B1" }).click();
  await page.getByLabel("Exam question").fill("Vous écrivez une lettre.");
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/sessions\//);

  await page.getByRole("button", { name: "Add submission" }).click();
  if (studentName) {
    await page.getByLabel("Student name (optional)").fill(studentName);
  }
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/submissions\//);
  return classUrl;
}

/**
 * Deletes a class with everything inside it.
 *
 * @param page The browser page.
 * @param classUrl The URL of the class page.
 * @param className The name of the class.
 */
export async function deleteClass(
  page: Page,
  classUrl: string,
  className: string,
) {
  await page.goto(classUrl);
  await page
    .getByRole("button", { name: `Actions for ${className}`, exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Delete class" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
}

/**
 * Draws a white page image with a red area where personal information would be.
 *
 * @param page The browser page.
 * @returns The image as a PNG file.
 */
export async function createPageImage(page: Page): Promise<Buffer> {
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

/**
 * Uploads two pages to the open submission and opens the redaction step.
 *
 * @param page The browser page.
 */
export async function openRedactionStep(page: Page) {
  const image = await createPageImage(page);
  await page.locator('input[type="file"]').setInputFiles([
    { name: "page-1.png", mimeType: "image/png", buffer: image },
    { name: "page-2.png", mimeType: "image/png", buffer: image },
  ]);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save (no redactions)" }),
  ).toBeVisible();
}

/**
 * Waits until a page image is loaded and returns where it is on the screen.
 *
 * @param page The browser page.
 * @param imageName The text read by screen readers for the image, such as "Page 1".
 * @returns The position and size of the image.
 */
export async function getLoadedImageBox(page: Page, imageName: string) {
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
  return box;
}
