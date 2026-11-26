import { clerk } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { signedInStateFile } from "../../playwright.config";

setup("sign in as the test user", async ({ page }) => {
  const emailAddress = process.env.E2E_CLERK_USER_EMAIL;
  if (!emailAddress) {
    throw new Error(
      "Set E2E_CLERK_USER_EMAIL to the email address of the test user's Clerk account.",
    );
  }

  await page.goto("/sign-in");
  await clerk.signIn({ page, emailAddress });
  await page.goto("/");
  await page.waitForURL((url) => url.pathname === "/");
  const userId = await page
    .waitForFunction(
      () =>
        (window as unknown as { Clerk?: { user?: { id: string } } }).Clerk?.user
          ?.id,
    )
    .then((handle) => handle.jsonValue());
  await page.evaluate((id) => {
    localStorage.setItem(
      `delf-grader:user:${id}:student-names-help-shown`,
      "true",
    );
  }, userId);

  await page.context().storageState({ path: signedInStateFile });
});
