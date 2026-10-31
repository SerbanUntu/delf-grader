import { expect, test } from "@playwright/test";
import { formatDate } from "@/lib/format";

const className = `E2E class ${Date.now()}`;
let classUrl: string | undefined;

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

test("a session can be created, renamed and deleted", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New class" }).click();
  await page.getByPlaceholder("Clasa a IX-a Z").fill(className);
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/classes\//);
  classUrl = page.url();
  await expect(
    page.getByRole("heading", { level: 1, name: className }),
  ).toBeVisible();

  const defaultName = `${className} - ${formatDate(new Date())}`;
  await page.getByRole("button", { name: "New session" }).click();
  await expect(page.getByLabel("Exam date")).toHaveText(formatDate(new Date()));
  await expect(page.getByPlaceholder(defaultName)).toBeVisible();
  await page.getByLabel("Rubric").click();
  await page.getByRole("option", { name: "New B1" }).click();
  await page
    .getByLabel("Exam question")
    .fill("Vous écrivez une lettre formelle au directeur de votre école.");
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/sessions\//);
  await expect(
    page.getByRole("heading", { level: 1, name: defaultName }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: `Actions for ${defaultName}`, exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Rename session" }).click();
  await page.getByLabel("Name (optional)").fill("Mock exam");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Mock exam" }),
  ).toBeVisible();

  await page.getByRole("link", { name: className, exact: true }).click();
  await expect(page.getByRole("link", { name: "Mock exam" })).toBeVisible();
  await page
    .getByRole("button", { name: "Actions for Mock exam", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Delete session" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("link", { name: "Mock exam" })).toHaveCount(0);
  await expect(page.getByText("No sessions yet.")).toBeVisible();
});
