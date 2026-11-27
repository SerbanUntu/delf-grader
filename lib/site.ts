export const siteName = "DELF Grader";

export const siteDescription =
  "A Next.js app that automatically transcribes and grades DELF Production Écrite handwritten papers using AI.";

export const siteUrl = "https://delf-grader.vercel.app";

export const pageTitleTemplate = `%s - ${siteName}`;

/**
 * Builds the browser tab title of a page, such as "Classes - DELF Grader".
 *
 * @param itemName The name of the page's item. Never pass a student name, because tab titles are kept in the browser history.
 * @return The tab title.
 */
export function formatPageTitle(itemName: string): string {
  return pageTitleTemplate.replace("%s", itemName);
}
