import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { formatDate } from "@/lib/format";
import { getStudentId } from "@/lib/student-ids";
import { createSubmission, deleteClass } from "./helpers";

const testKey = "-TsSpNKs0WewY7GLPZBfsf2lWOE5mu2fSZ2-R7vpmbI";
const studentName = "Élise Dupont";
const className = `E2E student names ${Date.now()}`;
let classUrl: string | undefined;

test.afterEach(async ({ page }) => {
  if (classUrl) {
    await deleteClass(page, classUrl, className);
    classUrl = undefined;
  }
});

function createNamesFile(key: string): Buffer {
  const content = JSON.stringify({ version: 1, key, names: {} });
  return Buffer.from(zipSync({ "student-names.json": strToU8(content) }));
}

async function importNamesFile(page: Page, buffer: Buffer, message: string) {
  await page.getByRole("button", { name: "Open user menu" }).click();
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("dialog", { name: "Account panel" })
    .getByRole("button", { name: "Import student names" })
    .click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "student-names.zip",
    mimeType: "application/zip",
    buffer,
  });
  const dialog = page.getByRole("dialog", { name: "Student names imported" });
  await expect(dialog).toContainText(message);
  await dialog.getByRole("button", { name: "OK" }).click();
  await expect(dialog).toBeHidden();
}

test("student names can be exported and imported in a browser without them", async ({
  page,
}) => {
  await page.goto("/");
  await importNamesFile(
    page,
    createNamesFile(testKey),
    "The file holds no student names.",
  );

  classUrl = await createSubmission(page, className, studentName);
  const submissionUrl = page.url();
  const classId = classUrl.split("/").at(-1) ?? "";
  await expect(page.getByText(studentName, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Open user menu" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("dialog", { name: "Account panel" })
    .getByRole("button", { name: "Export student names" })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    `delf-grader-student-names-${formatDate(new Date()).replaceAll("/", "-")}.zip`,
  );
  const exportedFile = await readFile(await download.path());
  const exported = JSON.parse(
    strFromU8(unzipSync(exportedFile)["student-names.json"]),
  );
  expect(exported.key).toBe(testKey);
  expect(
    exported.names[await getStudentId(testKey, classId, studentName)],
  ).toEqual({ classId, name: studentName });

  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("delf-grader:")) {
        localStorage.removeItem(key);
      }
    }
  });
  await page.reload();
  const helpDialog = page.getByRole("dialog", { name: "Import Student Names" });
  await expect(helpDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(helpDialog).toBeHidden();
  await expect(page.getByText(studentName, { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Identify" })).toBeVisible();

  await importNamesFile(
    page,
    exportedFile,
    "1 student name was added to this browser.",
  );
  await expect(page.getByText(studentName, { exact: true })).toBeVisible();

  await page.goto(submissionUrl);
  await expect(page.getByText(studentName, { exact: true })).toBeVisible();
  await expect(helpDialog).toBeHidden();
});

test("the help button explains how to restore student names", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student names help" }).click();
  const dialog = page.getByRole("dialog", { name: "Import Student Names" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "I still have the old browser" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "I no longer have the old browser" }),
  ).toBeVisible();
  await expect(dialog).toContainText('click "Export student names"');
  await expect(dialog).toContainText('click "Identify"');

  const fileChooserPromise = page.waitForEvent("filechooser");
  await dialog.getByRole("button", { name: "Import student names" }).click();
  await fileChooserPromise;
  await expect(dialog).toBeHidden();
});
