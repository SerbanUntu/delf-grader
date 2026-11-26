"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getClassStudentNames, useStudentNames } from "@/lib/students";

export type StudentNameValues = { studentName?: string };

/**
 * The optional student name field, which suggests the names already entered for the class.
 * It must be placed inside a form whose values include `StudentNameValues`.
 *
 * @param classId The ID of the submission's class.
 */
export function StudentNameField({ classId }: { classId: string }) {
  const { control } = useFormContext<StudentNameValues>();
  const names = useStudentNames();
  const listId = useId();

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
            {getClassStudentNames(names, classId).map((name) => (
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
