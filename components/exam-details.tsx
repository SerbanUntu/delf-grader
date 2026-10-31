"use client";

import { Pencil1Icon } from "@radix-ui/react-icons";
import { type ReactNode, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  ExamForm,
  type ExamFormValues,
  type NameField,
} from "@/components/exam-form";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { getRubric } from "@/lib/rubrics";
import type { ExamValues } from "@/lib/schemas";

/**
 * A card showing the exam date, rubric and exam question, which the teacher can edit when `onSave` is given.
 *
 * @param exam The exam date, rubric and question.
 * @param nameField The name field shown while editing. Without it, the name is not edited here.
 * @param initialName The value of the name field while editing.
 * @param onSave Called with the edited values. Without it, the details cannot be edited.
 * @param getSaveWarning Called with the edited values before saving. When it returns a warning, such as which steps will be re-run, the values are only saved once the teacher confirms it.
 * @param note A short text shown under the details.
 */
export function ExamDetails({
  exam,
  nameField,
  initialName = "",
  onSave,
  getSaveWarning,
  note,
}: {
  exam: ExamValues;
  nameField?: NameField;
  initialName?: string;
  onSave?: (values: ExamFormValues) => Promise<unknown>;
  getSaveWarning?: (values: ExamFormValues) => ReactNode;
  note?: ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingSave, setPendingSave] = useState<{
    values: ExamFormValues;
    warning: ReactNode;
  }>();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string>();

  async function save(values: ExamFormValues) {
    if (!onSave) {
      return;
    }
    setError(undefined);
    const warning = getSaveWarning?.(values);
    if (warning) {
      setPendingSave({ values, warning });
      setIsConfirming(true);
      return;
    }
    await onSave(values);
    setIsEditing(false);
  }

  async function confirmSave() {
    if (!onSave || !pendingSave) {
      return;
    }
    try {
      await onSave(pendingSave.values);
      setIsEditing(false);
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Exam</h2>
        {onSave && !isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil1Icon aria-hidden className="mr-2 size-4" />
            Edit
          </Button>
        )}
      </div>
      {onSave && isEditing ? (
        <div className="mt-4 grid gap-4">
          <FormError message={error} />
          <ExamForm
            initialValues={{
              examDate: exam.examDate,
              rubricId: exam.rubricId,
              question: exam.question,
              name: initialName,
            }}
            nameField={nameField}
            submitLabel="Save"
            onSubmit={save}
            onCancel={() => {
              setError(undefined);
              setIsEditing(false);
            }}
          />
        </div>
      ) : (
        <dl className="mt-4 grid gap-4">
          <DetailRow label="Exam date">{formatDate(exam.examDate)}</DetailRow>
          <DetailRow label="Rubric">{getRubric(exam.rubricId).name}</DetailRow>
          <DetailRow label="Exam question">
            <div className="max-h-60 overflow-y-auto whitespace-pre-wrap">
              {exam.question}
            </div>
          </DetailRow>
        </dl>
      )}
      {note && <p className="mt-4 text-muted-foreground">{note}</p>}

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title="Save the changed exam?"
        description={pendingSave?.warning}
        onConfirm={confirmSave}
      />
    </Card>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="font-medium">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
