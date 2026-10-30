import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export const signedInStateFile = "playwright/.clerk/user.json";

export default defineConfig({
  testDir: "./test/e2e",
  globalSetup: "./test/e2e/global.setup.ts",
  reporter: process.env.CI ? "github" : "list",
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: signedInStateFile },
    },
  ],
  webServer: {
    command: "pnpm exec next dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
