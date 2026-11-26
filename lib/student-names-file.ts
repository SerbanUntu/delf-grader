import { ConvexError } from "convex/values";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";
import { formatDate } from "@/lib/format";
import { isHash, parseStudentKey } from "@/lib/student-ids";
import { type StudentNamesData, studentNamesSchema } from "@/lib/students";

const dataFileName = "student-names.json";
const invalidFileMessage =
  'This is not a student names file. Pick the file downloaded with "Export student names".';

const fileSchema = z.object({
  version: z.literal(1),
  key: z.string().nullable(),
  names: studentNamesSchema,
});

/**
 * Builds the name of the exported student names file, such as "delf-grader-student-names-31-12-1999.zip", with today's date.
 *
 * @returns The file name.
 */
export function getStudentNamesFileName(): string {
  return `delf-grader-student-names-${formatDate(new Date()).replaceAll("/", "-")}.zip`;
}

/**
 * Builds the zip file holding the secret student key and the student names of this browser.
 *
 * @param data The key and the students, by student ID.
 * @returns The zip file.
 */
export function createStudentNamesFile(data: StudentNamesData): Blob {
  const content = JSON.stringify({ version: 1, ...data }, null, 2);
  const zip = zipSync({ [dataFileName]: strToU8(content) });
  return new Blob([zip], { type: "application/zip" });
}

/**
 * Reads a zip file made by `createStudentNamesFile`.
 *
 * @param file The file picked by the teacher.
 * @returns The key (null if the exporting browser had none) and the students, by student ID.
 * @throws If the file is not a valid student names file.
 */
export async function readStudentNamesFile(
  file: Blob,
): Promise<StudentNamesData> {
  let parsed: z.infer<typeof fileSchema>;
  try {
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (entry) => entry.name === dataFileName,
    });
    parsed = fileSchema.parse(JSON.parse(strFromU8(entries[dataFileName])));
  } catch {
    throw new ConvexError(invalidFileMessage);
  }
  const key = parsed.key === null ? null : parseStudentKey(parsed.key);
  if (
    (parsed.key !== null && key === null) ||
    !Object.keys(parsed.names).every(isHash)
  ) {
    throw new ConvexError(invalidFileMessage);
  }
  return { key, names: parsed.names };
}
