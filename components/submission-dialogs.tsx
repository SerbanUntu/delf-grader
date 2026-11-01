"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormError } from "@/components/form-error";
import { StudentNameField } from "@/components/student-name-field";
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
import { getErrorMessage } from "@/lib/errors";
import { defaultSubmissionName, submissionNameHint } from "@/lib/format";
import { optionalNameSchema } from "@/lib/schemas";
import { useStudentKeys } from "@/lib/students";

const newSubmissionSchema = z.object({
  studentName: optionalNameSchema,
  name: optionalNameSchema,
});

type NewSubmissionValues = z.infer<typeof newSubmissionSchema>;

/**
 * A dialog for adding a submission to a session, with the student name and the submission name.
 *
 * @param open Whether the dialog is shown.
 * @param onOpenChange Called when the dialog opens or closes.
 * @param classId The ID of the session's class.
 * @param onCreate Called with the trimmed names. The dialog closes once it finishes, and shows the error if it fails.
 */
export function NewSubmissionDialog({
  open,
  onOpenChange,
  classId,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onCreate: (values: NewSubmissionValues) => Promise<unknown>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <NewSubmissionForm
          classId={classId}
          onCreate={onCreate}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function NewSubmissionForm({
  classId,
  onCreate,
  onDone,
}: {
  classId: string;
  onCreate: (values: NewSubmissionValues) => Promise<unknown>;
  onDone: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(newSubmissionSchema),
    defaultValues: { studentName: "", name: defaultSubmissionName },
  });

  async function handleSubmit(values: NewSubmissionValues) {
    try {
      await onCreate(values);
      onDone();
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid gap-5"
        noValidate
      >
        <DialogHeader>
          <DialogTitle>Add submission</DialogTitle>
        </DialogHeader>
        <StudentNameField classId={classId} />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Submission name</FormLabel>
              <FormControl>
                <Input
                  placeholder={defaultSubmissionName}
                  autoComplete="off"
                  className="text-base"
                  {...field}
                />
              </FormControl>
              <FormDescription>{submissionNameHint}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormError message={form.formState.errors.root?.message} />
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Create
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

const studentSchema = z.object({ studentName: optionalNameSchema });

/**
 * A dialog for changing the student of a submission. The name field starts empty, and saving it empty removes the student.
 *
 * @param open Whether the dialog is shown.
 * @param onOpenChange Called when the dialog opens or closes.
 * @param classId The ID of the submission's class.
 * @param onSave Called with the trimmed student name. The dialog closes once it finishes, and shows the error if it fails.
 */
export function StudentDialog({
  open,
  onOpenChange,
  classId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onSave: (studentName: string) => Promise<unknown>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <StudentForm
          classId={classId}
          onSave={onSave}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function StudentForm({
  classId,
  onSave,
  onDone,
}: {
  classId: string;
  onSave: (studentName: string) => Promise<unknown>;
  onDone: () => void;
}) {
  const { needsImport } = useStudentKeys();
  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: { studentName: "" },
  });

  async function handleSubmit(values: { studentName: string }) {
    try {
      await onSave(values.studentName);
      onDone();
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid gap-5"
        noValidate
      >
        <DialogHeader>
          <DialogTitle>Change student</DialogTitle>
          <DialogDescription className="text-base">
            Type the name of the student who wrote this submission. Leave it
            empty to remove the student from this submission.
          </DialogDescription>
        </DialogHeader>
        <StudentNameField classId={classId} />
        <FormError message={form.formState.errors.root?.message} />
        <DialogFooter>
          <Button
            type="submit"
            disabled={needsImport || form.formState.isSubmitting}
          >
            Save
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
