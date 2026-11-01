"use client";

import { type FormEvent, useId, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/errors";
import { useStudentKeys } from "@/lib/students";

/**
 * A dialog to copy the secret student key of this browser, or to import or create one.
 *
 * @param open Whether the dialog is shown.
 * @param onOpenChange Called when the dialog opens or closes.
 */
export function StudentKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <StudentKeyContent onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function StudentKeyContent({ onDone }: { onDone: () => void }) {
  const { key } = useStudentKeys();
  const [isImporting, setIsImporting] = useState(false);

  if (key && !isImporting) {
    return <CopyKey studentKey={key} onImport={() => setIsImporting(true)} />;
  }
  return (
    <ImportKey
      onDone={onDone}
      onCancel={key ? () => setIsImporting(false) : undefined}
    />
  );
}

function CopyKey({
  studentKey,
  onImport,
}: {
  studentKey: string;
  onImport: () => void;
}) {
  const inputId = useId();
  const [isCopied, setIsCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(studentKey);
      setIsCopied(true);
    } catch {
      document.getElementById(inputId)?.focus();
    }
  }

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Student key</DialogTitle>
        <DialogDescription className="text-base">
          Student names never leave this browser. The server only receives an
          anonymous ID made from each name and this key. To see and enter
          student names in another browser, copy this key and import it there.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor={inputId} className="text-base">
          Your student key
        </Label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            value={studentKey}
            readOnly
            onFocus={(event) => event.target.select()}
            className="font-mono text-base"
          />
          <Button onClick={copy}>{isCopied ? "Copied" : "Copy"}</Button>
        </div>
        <p className="text-muted-foreground">
          Keep this key private, like a password.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onImport}>
          Import a different key
        </Button>
      </DialogFooter>
    </div>
  );
}

function ImportKey({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel?: () => void;
}) {
  const inputId = useId();
  const { key, hasAnyKey, createKey, importKey } = useStudentKeys();
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);
  const [isConfirmingNewKey, setIsConfirmingNewKey] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    setError(undefined);
    setIsPending(true);
    try {
      await importKey(text);
      onDone();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
        <DialogHeader>
          <DialogTitle>Import student key</DialogTitle>
          <DialogDescription className="text-base">
            Student names are only kept in the browsers where they were entered.
            To see and enter them here, paste the student key copied from the
            user menu of a browser where your student names are shown.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={inputId} className="text-base">
            Student key
          </Label>
          <Input
            id={inputId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="font-mono text-base"
          />
        </div>
        <FormError message={error} />
        {!key && hasAnyKey === false && (
          <p className="text-muted-foreground">
            You do not have a student key yet. One is created automatically the
            first time you enter a student name.
          </p>
        )}
        {!key && hasAnyKey && (
          <p className="text-muted-foreground">
            No access to your key anymore?{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-base font-medium text-foreground underline"
              onClick={() => setIsConfirmingNewKey(true)}
            >
              Create a new key
            </Button>
          </p>
        )}
        <DialogFooter>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending || !text.trim()}>
            Import
          </Button>
        </DialogFooter>
      </form>
      <ConfirmDialog
        open={isConfirmingNewKey}
        onOpenChange={setIsConfirmingNewKey}
        title="Create a new student key?"
        description="Student IDs made with the new key will not match those made with your current key. Students entered in your other browsers will show as unknown here, and students entered here will show as unknown there."
        confirmLabel="Create new key"
        onConfirm={async () => {
          try {
            await createKey();
            onDone();
          } catch (caught) {
            setError(getErrorMessage(caught));
          }
        }}
      />
    </>
  );
}
