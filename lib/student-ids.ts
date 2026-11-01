const keyByteLength = 32;
const hashPattern = /^[0-9a-f]{64}$/;

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) {
    return null;
  }
  try {
    const binary = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function sign(key: string, message: string): Promise<string> {
  const bytes = fromBase64Url(key);
  if (bytes?.length !== keyByteLength) {
    throw new Error("The student key is not valid.");
  }
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Trims a student name and replaces repeated spaces with one space, which is how the name is shown and kept in the browser.
 *
 * @param name The name typed by the teacher.
 * @returns The cleaned name, which may be empty.
 */
export function cleanStudentName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Turns a student name into the form used to compute the student ID, ignoring case, accents and extra spaces.
 *
 * @param name The name typed by the teacher.
 * @returns The normalized name, so "Élise " and "elise" give the same value.
 */
export function normalizeStudentName(name: string): string {
  return cleanStudentName(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/**
 * Creates a new random secret key used to compute student IDs.
 *
 * @returns The key as text that the teacher can copy into another browser.
 */
export function createStudentKey(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(keyByteLength)));
}

/**
 * Reads a student key pasted by the teacher.
 *
 * @param text The pasted text, which may contain spaces or line breaks.
 * @returns The key, or null if the text is not a valid key.
 */
export function parseStudentKey(text: string): string | null {
  const key = text.replace(/\s+/g, "");
  return fromBase64Url(key)?.length === keyByteLength ? key : null;
}

/**
 * Computes the anonymous ID of a student, which is the only thing about the student sent to the server.
 *
 * @param key The secret student key.
 * @param classId The ID of the student's class, so the same name in two classes gives two IDs.
 * @param name The student name.
 * @returns The student ID, as 64 hexadecimal characters.
 */
export function getStudentId(
  key: string,
  classId: string,
  name: string,
): Promise<string> {
  return sign(key, `student:${classId}:${normalizeStudentName(name)}`);
}

/**
 * Computes a value that identifies a student key without revealing it, so the server can tell whether a pasted key is one of the teacher's keys.
 *
 * @param key The secret student key.
 * @returns The fingerprint, as 64 hexadecimal characters.
 */
export function getKeyFingerprint(key: string): Promise<string> {
  return sign(key, "fingerprint");
}

/**
 * Checks that a value has the form of a student ID or a key fingerprint.
 *
 * @param value The value to check.
 * @returns Whether the value is 64 lowercase hexadecimal characters.
 */
export function isHash(value: string): boolean {
  return hashPattern.test(value);
}

/**
 * Builds the label shown for a student whose name is not known in this browser, such as "Student #a3f9".
 *
 * @param studentId The student ID.
 * @returns The label.
 */
export function unknownStudentLabel(studentId: string): string {
  return `Student #${studentId.slice(0, 4)}`;
}
