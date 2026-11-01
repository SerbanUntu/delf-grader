"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StudentKeyNeeded } from "@/components/student-name-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { requiredNameSchema } from "@/lib/schemas";
import { getStudentId, unknownStudentLabel } from "@/lib/student-ids";
import { saveStudentName, useStudentKey, useStudentName } from "@/lib/students";

/**
 * The name of a submission's student, as entered in this browser. An unknown student is shown as "Student #a3f9", with a button to type their name.
 *
 * @param studentId The student ID, or undefined when the submission has no student, which shows nothing.
 * @param classId The ID of the submission's class.
 */
export function StudentLabel({
  studentId,
  classId,
}: {
  studentId: string | undefined;
  classId: string;
}) {
  const name = useStudentName(studentId);
  const [isIdentifying, setIsIdentifying] = useState(false);

  if (!studentId) {
    return null;
  }
  if (name) {
    return (
      <p className="font-medium wrap-break-word text-foreground">{name}</p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-medium text-foreground">
        {unknownStudentLabel(studentId)}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="relative z-10 text-base text-foreground"
        onClick={() => setIsIdentifying(true)}
      >
        Identify
      </Button>
      <Dialog open={isIdentifying} onOpenChange={setIsIdentifying}>
        <DialogContent>
          <IdentifyForm
            studentId={studentId}
            classId={classId}
            onDone={() => setIsIdentifying(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IdentifyForm({
  studentId,
  classId,
  onDone,
}: {
  studentId: string;
  classId: string;
  onDone: () => void;
}) {
  const key = useStudentKey();
  const form = useForm({
    resolver: zodResolver(z.object({ name: requiredNameSchema })),
    defaultValues: { name: "" },
  });

  async function handleSubmit(values: { name: string }) {
    if (!key) {
      return;
    }
    if ((await getStudentId(key, classId, values.name)) !== studentId) {
      form.setError("name", {
        message:
          "This name does not match the student of this submission. Check the spelling, and that this browser uses the same student key as the browser where the name was entered.",
      });
      return;
    }
    saveStudentName(studentId, classId, values.name);
    onDone();
  }

  const header = (
    <DialogHeader>
      <DialogTitle>Identify {unknownStudentLabel(studentId)}</DialogTitle>
      <DialogDescription className="text-base">
        This student&apos;s name was entered in another browser. Type it to show
        it here. It is checked against the student&apos;s anonymous ID, so a
        misspelled name cannot be attached to the wrong student.
      </DialogDescription>
    </DialogHeader>
  );

  if (!key) {
    return (
      <div className="grid gap-5">
        {header}
        <StudentKeyNeeded />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid gap-5"
        noValidate
      >
        {header}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student name</FormLabel>
              <FormControl>
                <Input autoComplete="off" className="text-base" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Identify
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
