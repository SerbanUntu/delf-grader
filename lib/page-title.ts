import { useEffect } from "react";
import { formatPageTitle, siteName } from "@/lib/site";

/**
 * Shows "<item name> - DELF Grader" as the browser tab title, or "DELF Grader" while the item is loading or missing.
 *
 * @param itemName The name of the page's item. Never pass a student name, because tab titles are kept in the browser history.
 */
export function usePageTitle(itemName: string | undefined) {
  useEffect(() => {
    document.title = itemName ? formatPageTitle(itemName) : siteName;
  }, [itemName]);
}
