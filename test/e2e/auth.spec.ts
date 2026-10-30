import { expect, test } from "@playwright/test";

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("visitors are redirected to the sign-in page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/sign-in\?redirect_url=/);
  });

  test("the sign-in page loads", async ({ page }) => {
    const response = await page.goto("/sign-in");

    expect(response?.status()).toBe(200);
    await expect(page.getByLabel("Email address")).toBeVisible();
  });
});
