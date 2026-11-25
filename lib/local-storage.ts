const listeners = new Set<() => void>();

/**
 * Calls a function whenever a value kept in local storage changes, in this tab or in another one.
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
 * Reads a value kept in local storage.
 *
 * @param name The name of the value.
 * @returns The value, or null if there is none or local storage cannot be used.
 */
export function readStorageItem(name: string): string | null {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

/**
 * Keeps a value in local storage and tells every listener in this tab.
 *
 * @param name The name of the value.
 * @param value The value.
 */
export function writeStorageItem(name: string, value: string) {
  localStorage.setItem(name, value);
  for (const listener of listeners) {
    listener();
  }
}
