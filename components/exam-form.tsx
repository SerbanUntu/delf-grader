"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { ExamFields } from "@/components/exam-fields";
import { FormError } from "@/components/form-error";
import { StudentNameField } from "@/components/student-name-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { isIsoDate, toIsoDate } from "@/lib/format";
import { examSchema, optionalNameSchema } from "@/lib/schemas";

const examFormSchema = examSchema.extend({
  name: optionalNameSchema,
  studentName: optionalNameSchema.optional(),
});

export type ExamFormValues = z.infer<typeof examFormSchema>;

type InitialValues = Omit<ExamFormValues, "rubricId"> &
  Partial<Pick<ExamFormValues, "rubricId">>;

export type NameField = {
  label: string;
  placeholder: (examDate: string | undefined) => string;
  hint?: string;
};

type ExamFormProps = {
  initialValues: InitialValues;
  nameField?: NameField;
  studentClassId?: string;
  submitLabel: string;
  onSubmit: (values: ExamFormValues) => Promise<unknown>;
  onDone?: () => void;
  onCancel?: () => void;
};

/**
 * A form with the exam date, rubric and exam question, and optionally a name, for sessions and individual submissions.
 *
 * @param initialValues The values of the fields when the form opens.
 * @param nameField The name field, shown after the exam fields. Without it, the form has no name field.
 * @param studentClassId The ID of the class, given to show the student name field before the name field.
 * @param submitLabel The label of the submit button.
 * @param onSubmit Called with the checked values. The form shows the error if it fails.
 * @param onDone Called once `onSubmit` succeeds.
 * @param onCancel Called when the teacher clicks "Cancel". Without it, there is no "Cancel" button.
 */
export function ExamForm({
  initialValues,
  nameField,
  studentClassId,
  submitLabel,
  onSubmit,
  onDone,
  onCancel,
}: ExamFormProps) {
  const form = useForm<ExamFormValues, unknown, ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: initialValues,
  });
  const examDate = useWatch({ control: form.control, name: "examDate" });

  async function handleSubmit(values: ExamFormValues) {
    try {
      await onSubmit(values);
      onDone?.();
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
        <ExamFields />
        {studentClassId && <StudentNameField classId={studentClassId} />}
        {nameField && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{nameField.label}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={nameField.placeholder(
                      isIsoDate(examDate) ? examDate : undefined,
                    )}
                    autoComplete="off"
                    className="text-base"
                    {...field}
                  />
                </FormControl>
                {nameField.hint && (
                  <FormDescription>{nameField.hint}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormError message={form.formState.errors.root?.message} />
        <div className="flex flex-wrap justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/**
 * A dialog for creating a session or an individual submission, with the exam fields and a name.
 *
 * @param open Whether the dialog is shown.
 * @param onOpenChange Called when the dialog opens or closes.
 * @param title The title of the dialog.
 * @param initialName The value of the name field when the dialog opens.
 * @param nameField The name field.
 * @param studentClassId The ID of the class, given to show the student name field, for individual submissions.
 * @param onCreate Called with the checked values. The dialog closes once it finishes, and shows the error if it fails.
 */
export function ExamDialog({
  open,
  onOpenChange,
  title,
  initialName,
  nameField,
  studentClassId,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialName: string;
  nameField: NameField;
  studentClassId?: string;
  onCreate: (values: ExamFormValues) => Promise<unknown>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ExamForm
          initialValues={{
            name: initialName,
            examDate: toIsoDate(new Date()),
            question: "",
            ...(studentClassId && { studentName: "" }),
          }}
          nameField={nameField}
          studentClassId={studentClassId}
          submitLabel="Create"
          onSubmit={onCreate}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
