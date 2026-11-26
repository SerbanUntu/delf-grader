const appPrefix = "delf-grader:";
const userPrefix = `${appPrefix}user:`;

const listeners = new Set<() => void>();
let storageUserId: string | null = null;

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function toStorageKey(name: string): string | null {
  return storageUserId ? `${userPrefix}${storageUserId}:${name}` : null;
}

/**
 * Reads the ID of the signed-in user, under which everything kept in this browser is stored.
 *
 * @returns The user ID, or null when nobody is signed in.
 */
export function getStorageUserId(): string | null {
  return storageUserId;
}

/**
 * Sets the signed-in user, under whose ID everything kept in this browser is stored, and tells every listener in this tab.
 *
 * @param userId The user ID, or null when nobody is signed in.
 */
export function setStorageUserId(userId: string | null) {
  if (userId === storageUserId) {
    return;
  }
  storageUserId = userId;
  notifyListeners();
}

/**
 * Moves the values kept in local storage before they were stored under a user ID to the given user, unless that user already has a value with the same name.
 *
 * @param userId The ID of the signed-in user.
 */
export function moveStorageWithoutUser(userId: string) {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) =>
      localStorage.key(index),
    );
    for (const key of keys) {
      if (!key?.startsWith(appPrefix) || key.startsWith(userPrefix)) {
        continue;
      }
      const value = localStorage.getItem(key);
      const newKey = `${userPrefix}${userId}:${key.slice(appPrefix.length)}`;
      if (value !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, value);
      }
      localStorage.removeItem(key);
    }
  } catch {}
}

/**
 * Calls a function whenever a value kept in local storage changes, in this tab or in another one, or when the signed-in user changes.
 *
 * @param listener The function to call.
 * @returns A function that stops calling it.
 */
export function subscribeToStorage(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * Reads a value kept in local storage for the signed-in user.
 *
 * @param name The name of the value.
 * @returns The value, or null if there is none, nobody is signed in or local storage cannot be used.
 */
export function readStorageItem(name: string): string | null {
  const key = toStorageKey(name);
  if (!key) {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Keeps a value in local storage for the signed-in user and tells every listener in this tab.
 *
 * @param name The name of the value.
 * @param value The value.
 * @throws If nobody is signed in.
 */
export function writeStorageItem(name: string, value: string) {
  const key = toStorageKey(name);
  if (!key) {
    throw new Error("Sign in to save this in the browser.");
  }
  localStorage.setItem(key, value);
  notifyListeners();
}
