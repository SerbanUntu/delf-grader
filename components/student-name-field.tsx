"use client";

import { useId, useState } from "react";
import { useFormContext } from "react-hook-form";
import { StudentKeyDialog } from "@/components/student-key-dialog";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useStudentKeys, useStudentNames } from "@/lib/students";

export type StudentNameValues = { studentName?: string };

/**
 * The optional student name field, which suggests the names already entered for the class.
 * It must be placed inside a form whose values include `StudentNameValues`. When this browser does not have the teacher's student key yet, it asks to import it instead.
 *
 * @param classId The ID of the submission's class.
 */
export function StudentNameField({ classId }: { classId: string }) {
  const { control } = useFormContext<StudentNameValues>();
  const { needsImport } = useStudentKeys();
  const names = useStudentNames();
  const listId = useId();
  const suggestions = [
    ...new Set(
      Object.values(names)
        .filter((student) => student.classId === classId)
        .map((student) => student.name),
    ),
  ].sort((first, second) => first.localeCompare(second));

  if (needsImport) {
    return (
      <div className="grid gap-2">
        <p className="font-medium">Student name (optional)</p>
        <StudentKeyNeeded />
      </div>
    );
  }

  return (
    <FormField
      control={control}
      name="studentName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Student name (optional)</FormLabel>
          <FormControl>
            <Input
              list={listId}
              autoComplete="off"
              className="text-base"
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>
          <datalist id={listId}>
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <FormDescription>
            Only kept in this browser. The server receives an anonymous ID
            instead.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * A message asking the teacher to import their student key, shown instead of student name fields in a browser that does not have it.
 */
export function StudentKeyNeeded() {
  const [isImporting, setIsImporting] = useState(false);

  return (
    <div className="grid justify-items-start gap-3 rounded-lg border border-dashed p-4">
      <p className="text-muted-foreground">
        To enter student names in this browser, import your student key from a
        browser where your student names are shown.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsImporting(true)}
      >
        Import student key
      </Button>
      <StudentKeyDialog open={isImporting} onOpenChange={setIsImporting} />
    </div>
  );
}
