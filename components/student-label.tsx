"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { requiredNameSchema } from "@/lib/schemas";
import { getStudentId, unknownStudentLabel } from "@/lib/student-ids";
import {
  getClassStudentNames,
  saveStudentName,
  useStudentKey,
  useStudentName,
  useStudentNames,
} from "@/lib/students";

/**
 * The name of a submission's student, as entered in this browser. An unknown student is shown as "Student #abcd" (with its id), with a button to type their name.
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
  const names = useStudentNames();
  const listId = useId();
  const [unmatchedName, setUnmatchedName] = useState<string>();
  const form = useForm({
    resolver: zodResolver(z.object({ name: requiredNameSchema })),
    defaultValues: { name: "" },
  });
  const label = unknownStudentLabel(studentId);

  function save(name: string) {
    saveStudentName(studentId, classId, name);
    onDone();
  }

  async function handleSubmit(values: { name: string }) {
    if (key && (await getStudentId(key, classId, values.name)) === studentId) {
      save(values.name);
      return;
    }
    setUnmatchedName(values.name);
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid gap-5"
          noValidate
        >
          <DialogHeader>
            <DialogTitle>Identify {label}</DialogTitle>
            <DialogDescription className="text-base">
              This student&apos;s name is not known in this browser. Type it to
              show it on every submission of {label} in this class.
            </DialogDescription>
          </DialogHeader>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student name</FormLabel>
                <FormControl>
                  <Input
                    list={listId}
                    autoComplete="off"
                    className="text-base"
                    {...field}
                  />
                </FormControl>
                <datalist id={listId}>
                  {getClassStudentNames(names, classId).map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <FormDescription>
                  Only kept in this browser. The name is checked against the
                  anonymous ID with this browser&apos;s student key.
                </FormDescription>
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
      <ConfirmDialog
        open={unmatchedName !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setUnmatchedName(undefined);
          }
        }}
        title={`Save "${unmatchedName ?? ""}" for ${label}?`}
        description={
          <div className="grid gap-3">
            <p>
              {key
                ? `This name does not give the anonymous ID of ${label} with the student key of this browser.`
                : "This browser has no student key yet, so the name cannot be checked against the anonymous ID."}{" "}
              Either the name was entered with another key, for example in a
              browser you no longer have, or it has a typo.
            </p>
            <p>
              If you are sure this is the right student, save the name anyway.
              Every submission of {label} in this class will then show it in
              this browser.
            </p>
          </div>
        }
        confirmLabel="Save anyway"
        onConfirm={() => {
          if (unmatchedName !== undefined) {
            save(unmatchedName);
          }
        }}
      />
    </>
  );
}
