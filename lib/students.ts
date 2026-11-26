import { useMutation, useQuery } from "convex/react";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import {
  cleanStudentName,
  createStudentKey,
  getKeyFingerprint,
  getStudentId,
  parseStudentKey,
  unknownStudentLabel,
} from "@/lib/student-ids";
import {
  readStorageItem,
  subscribeToStorage,
  writeStorageItem,
} from "./local-storage";

const keyStorageName = "student-key";
const namesStorageName = "student-names";

export const studentNamesSchema = z.record(
  z.string(),
  z.object({ classId: z.string(), name: z.string() }),
);

export type StudentNames = z.infer<typeof studentNamesSchema>;

export type StudentNamesData = { key: string | null; names: StudentNames };

const emptyNames: StudentNames = {};
let cachedNames: { text: string | null; names: StudentNames } = {
  text: null,
  names: emptyNames,
};

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
  const text = readStorageItem(namesStorageName);
  if (text !== cachedNames.text) {
    cachedNames = { text, names: parseNames(text) };
  }
  return cachedNames.names;
}

function readKey(): string | null {
  const text = readStorageItem(keyStorageName);
  return text ? parseStudentKey(text) : null;
}

/**
 * Reads the secret student key kept in this browser, and updates when it changes.
 *
 * @returns The key, or null if this browser has none.
 */
export function useStudentKey(): string | null {
  return useSyncExternalStore(subscribeToStorage, readKey, () => null);
}

/**
 * Reads the names of all students entered in this browser, and updates when they change.
 *
 * @returns The students, by student ID.
 */
export function useStudentNames(): StudentNames {
  return useSyncExternalStore(subscribeToStorage, readNames, () => emptyNames);
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
 * Lists the names entered in this browser for the students of one class, without duplicates and sorted from A to Z.
 *
 * @param names The students entered in this browser.
 * @param classId The ID of the class.
 * @returns The names.
 */
export function getClassStudentNames(
  names: StudentNames,
  classId: string,
): string[] {
  return [
    ...new Set(
      Object.values(names)
        .filter((student) => student.classId === classId)
        .map((student) => student.name),
    ),
  ].sort((first, second) => first.localeCompare(second));
}

/**
 * Builds the text shown for a submission's student: their name, or "Student #abcd" (with its id) when it is not known in this browser.
 *
 * @param names The students entered in this browser.
 * @param studentId The student ID, or undefined when the submission has no student.
 * @returns The text, or an empty string when the submission has no student.
 */
export function getStudentLabel(
  names: StudentNames,
  studentId: string | undefined,
): string {
  if (!studentId) {
    return "";
  }
  return names[studentId]?.name ?? unknownStudentLabel(studentId);
}

/**
 * Remembers the name of a student in this browser, replacing the name saved for that student ID if there is one.
 *
 * @param studentId The student ID, computed from the name or picked by the teacher when identifying a student.
 * @param classId The ID of the student's class.
 * @param name The student name.
 */
export function saveStudentName(
  studentId: string,
  classId: string,
  name: string,
) {
  writeStorageItem(
    namesStorageName,
    JSON.stringify({
      ...readNames(),
      [studentId]: { classId, name: cleanStudentName(name) },
    }),
  );
}

/**
 * Reads the secret student key and the names of all students entered in this browser, as they are exported to a file.
 *
 * @returns The key (null if this browser has none) and the students, by student ID.
 */
export function readStudentNamesData(): StudentNamesData {
  return { key: readKey(), names: readNames() };
}

/**
 * Gives access to the secret student key: whether the teacher already has one, and how to import student names or compute student IDs.
 *
 * @returns The key of this browser (null if it has none), whether the teacher has created or imported a key in any browser (undefined while loading), and functions to import student names and compute student IDs.
 */
export function useStudentKeys() {
  const key = useStudentKey();
  const hasAnyKey = useQuery(api.studentKeys.hasAny);
  const addKey = useMutation(api.studentKeys.add);

  async function saveKey(newKey: string) {
    await addKey({ fingerprint: await getKeyFingerprint(newKey) });
    writeStorageItem(keyStorageName, newKey);
  }

  async function importStudentNames(data: StudentNamesData): Promise<number> {
    if (data.key) {
      await saveKey(data.key);
    }
    const currentNames = readNames();
    const addedCount = Object.keys(data.names).filter(
      (studentId) => !(studentId in currentNames),
    ).length;
    writeStorageItem(
      namesStorageName,
      JSON.stringify({ ...data.names, ...currentNames }),
    );
    return addedCount;
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
      currentKey = createStudentKey();
      await saveKey(currentKey);
    }
    const studentId = await getStudentId(currentKey, classId, cleanedName);
    saveStudentName(studentId, classId, cleanedName);
    return studentId;
  }

  return { key, hasAnyKey, importStudentNames, toStudentId };
}
