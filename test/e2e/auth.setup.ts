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

  await page.context().storageState({ path: signedInStateFile });
});
