import { useConvex, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import {
  cleanStudentName,
  createStudentKey,
  getKeyFingerprint,
  getStudentId,
  parseStudentKey,
} from "@/lib/student-ids";

const keyStorageName = "delf-grader:student-key";
const namesStorageName = "delf-grader:student-names";

const studentNamesSchema = z.record(
  z.string(),
  z.object({ classId: z.string(), name: z.string() }),
);

export type StudentNames = z.infer<typeof studentNamesSchema>;

const emptyNames: StudentNames = {};
const listeners = new Set<() => void>();
let cachedNames: { text: string | null; names: StudentNames } = {
  text: null,
  names: emptyNames,
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readItem(name: string): string | null {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

function writeItem(name: string, value: string) {
  localStorage.setItem(name, value);
  for (const listener of listeners) {
    listener();
  }
}

function parseNames(text: string | null): StudentNames {
  if (!text) {
    return emptyNames;
  }
  try {
    return studentNamesSchema.parse(JSON.parse(text));
  } catch {
    return emptyNames;
  }
}

function readNames(): StudentNames {
  const text = readItem(namesStorageName);
  if (text !== cachedNames.text) {
    cachedNames = { text, names: parseNames(text) };
  }
  return cachedNames.names;
}

function readKey(): string | null {
  const text = readItem(keyStorageName);
  return text ? parseStudentKey(text) : null;
}

/**
 * Reads the secret student key kept in this browser, and updates when it changes.
 *
 * @returns The key, or null if this browser has none.
 */
export function useStudentKey(): string | null {
  return useSyncExternalStore(subscribe, readKey, () => null);
}

/**
 * Reads the names of all students entered in this browser, and updates when they change.
 *
 * @returns The students, by student ID.
 */
export function useStudentNames(): StudentNames {
  return useSyncExternalStore(subscribe, readNames, () => emptyNames);
}

/**
 * Reads the name of one student, as entered in this browser.
 *
 * @param studentId The student ID, or undefined when the submission has no student.
 * @returns The name, or undefined if it is not known in this browser.
 */
export function useStudentName(
  studentId: string | undefined,
): string | undefined {
  const names = useStudentNames();
  return studentId ? names[studentId]?.name : undefined;
}

/**
 * Remembers the name of a student in this browser.
 *
 * @param studentId The student ID computed from the name.
 * @param classId The ID of the student's class.
 * @param name The student name.
 */
export function saveStudentName(
  studentId: string,
  classId: string,
  name: string,
) {
  writeItem(
    namesStorageName,
    JSON.stringify({
      ...readNames(),
      [studentId]: { classId, name: cleanStudentName(name) },
    }),
  );
}

/**
 * Gives access to the secret student key: whether this browser needs it, and how to create, import or use it.
 *
 * @returns The key of this browser (null if it has none), whether the teacher has created or imported a key in any browser (undefined while loading), whether this browser must import the key before student names can be entered, and functions to create a key, import a key and compute student IDs.
 */
export function useStudentKeys() {
  const convex = useConvex();
  const key = useStudentKey();
  const hasAnyKey = useQuery(api.studentKeys.hasAny);
  const addKey = useMutation(api.studentKeys.add);

  async function createKey(): Promise<string> {
    const newKey = createStudentKey();
    await addKey({ fingerprint: await getKeyFingerprint(newKey) });
    writeItem(keyStorageName, newKey);
    return newKey;
  }

  async function importKey(text: string) {
    const pastedKey = parseStudentKey(text);
    if (!pastedKey) {
      throw new ConvexError(
        "This is not a valid student key. Copy the whole key and try again.",
      );
    }
    const fingerprint = await getKeyFingerprint(pastedKey);
    const isKnown = await convex.query(api.studentKeys.isKnown, {
      fingerprint,
    });
    if (!isKnown) {
      if (await convex.query(api.studentKeys.hasAny, {})) {
        throw new ConvexError(
          "This key is not one of your student keys. Copy it again from a browser where your student names are shown.",
        );
      }
      await addKey({ fingerprint });
    }
    writeItem(keyStorageName, pastedKey);
  }

  async function toStudentId(
    classId: string,
    name: string,
  ): Promise<string | undefined> {
    const cleanedName = cleanStudentName(name);
    if (!cleanedName) {
      return undefined;
    }
    let currentKey = readKey();
    if (!currentKey) {
      if (await convex.query(api.studentKeys.hasAny, {})) {
        throw new ConvexError(
          "Import your student key from the user menu before entering student names.",
        );
      }
      currentKey = await createKey();
    }
    const studentId = await getStudentId(currentKey, classId, cleanedName);
    saveStudentName(studentId, classId, cleanedName);
    return studentId;
  }

  return {
    key,
    hasAnyKey,
    needsImport: !key && hasAnyKey === true,
    createKey,
    importKey,
    toStudentId,
  };
}
