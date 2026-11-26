import { useEffect, useState } from "react";
import { getStorageUserId } from "./local-storage";

const databaseName = "delf-grader";
const storeName = "localPages";

const listeners = new Set<() => void>();
let databasePromise: Promise<IDBDatabase> | undefined;

export type LocalPage = {
  id: string;
  url: string;
  blob: Blob;
};

function openDatabase(): Promise<IDBDatabase> {
  databasePromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = undefined;
      reject(request.error);
    };
  });
  return databasePromise;
}

async function runTransaction<Result>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<Result> | undefined,
): Promise<Result | undefined> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = run(transaction.objectStore(storeName));
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function toPagesKey(submissionId: string): string | null {
  const userId = getStorageUserId();
  return userId ? `${userId}:${submissionId}` : null;
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Reads the unredacted pages of a submission kept in this browser.
 *
 * @param submissionId The submission ID.
 * @returns The page images in order, or null if this browser has none.
 */
export async function getLocalPages(
  submissionId: string,
): Promise<Blob[] | null> {
  const key = toPagesKey(submissionId);
  if (!key) {
    return null;
  }
  const pages = await runTransaction<Blob[] | undefined>("readonly", (store) =>
    store.get(key),
  );
  return pages?.length ? pages : null;
}

/**
 * Keeps the unredacted pages of a submission in this browser for the signed-in user, replacing any pages kept before.
 *
 * @param submissionId The submission ID.
 * @param pages The page images in order.
 * @throws If nobody is signed in.
 */
export async function saveLocalPages(submissionId: string, pages: Blob[]) {
  const key = toPagesKey(submissionId);
  if (!key) {
    throw new Error("Sign in to keep the pages in this browser.");
  }
  await runTransaction("readwrite", (store) => store.put(pages, key));
  notifyListeners();
}

/**
 * Deletes the unredacted pages of submissions from this browser.
 *
 * @param submissionIds The submission IDs.
 */
export async function deleteLocalPages(submissionIds: string[]) {
  const keys = submissionIds.flatMap((submissionId) => {
    const key = toPagesKey(submissionId);
    return key ? [key] : [];
  });
  if (keys.length === 0) {
    return;
  }
  await runTransaction("readwrite", (store) => {
    for (const key of keys) {
      store.delete(key);
    }
    return undefined;
  });
  notifyListeners();
}

/**
 * Moves the unredacted pages kept in this browser before they were stored under a user ID to the given user.
 *
 * @param userId The ID of the signed-in user.
 */
export async function moveLocalPagesWithoutUser(userId: string) {
  let hasMovedPages = false;
  await runTransaction("readwrite", (store) => {
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        return;
      }
      const submissionId = String(cursor.key);
      if (!submissionId.includes(":")) {
        store.put(cursor.value, `${userId}:${submissionId}`);
        cursor.delete();
        hasMovedPages = true;
      }
      cursor.continue();
    };
    return undefined;
  });
  if (hasMovedPages) {
    notifyListeners();
  }
}

/**
 * Reads the unredacted pages of a submission kept in this browser, and updates when they change.
 *
 * @param submissionId The submission ID.
 * @returns The pages, null if this browser has none, or undefined while they load.
 */
export function useLocalPages(
  submissionId: string,
): LocalPage[] | null | undefined {
  const [blobs, setBlobs] = useState<Blob[] | null | undefined>(undefined);

  useEffect(() => {
    let isCurrent = true;
    function load() {
      getLocalPages(submissionId)
        .catch(() => null)
        .then((pages) => {
          if (isCurrent) {
            setBlobs(pages);
          }
        });
    }
    load();
    listeners.add(load);
    return () => {
      isCurrent = false;
      listeners.delete(load);
    };
  }, [submissionId]);

  return usePageUrls(blobs);
}

/**
 * Creates a URL to show one page image, which stays valid while the component is shown.
 *
 * @param blob The page image.
 * @returns The URL, or undefined while it is created.
 */
export function useBlobUrl(blob: Blob): string | undefined {
  const [created, setCreated] = useState<{ blob: Blob; url: string }>();

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setCreated({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return created?.blob === blob ? created.url : undefined;
}

/**
 * Creates URLs to show page images, which stay valid while the component is shown.
 *
 * @param blobs The page images, null or undefined.
 * @returns The pages with their URLs, null or undefined like the input, or undefined while the URLs are created.
 */
export function usePageUrls(
  blobs: Blob[] | null | undefined,
): LocalPage[] | null | undefined {
  const [created, setCreated] = useState<{
    blobs: Blob[];
    pages: LocalPage[];
  }>();

  useEffect(() => {
    if (!blobs) {
      return;
    }
    const pages = blobs.map((blob) => {
      const url = URL.createObjectURL(blob);
      return { id: url, url, blob };
    });
    setCreated({ blobs, pages });
    return () => {
      for (const page of pages) {
        URL.revokeObjectURL(page.url);
      }
    };
  }, [blobs]);

  if (!blobs) {
    return blobs;
  }
  return created?.blobs === blobs ? created.pages : undefined;
}
