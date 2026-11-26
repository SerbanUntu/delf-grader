"use client";

import { useConvex, useMutation } from "convex/react";
import { useEffect, useId, useRef, useState } from "react";
import { FormError } from "@/components/form-error";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errors";
import { maxNotesLength, noStudentNamesHint } from "@/lib/format";

const saveDelay = 5000;

/**
 * The teacher's notes on a submission, saved automatically while typing, when the field loses focus and when leaving the page.
 *
 * @param submissionId The submission ID.
 * @param notes The notes saved on the server.
 */
export function NotesField({
  submissionId,
  notes,
}: {
  submissionId: Id<"submissions">;
  notes: string;
}) {
  const saveNotes = useMutation(api.submissions.saveNotes);
  const convex = useConvex();
  const fieldId = useId();
  const hintId = useId();
  const [draft, setDraft] = useState(notes);
  const [error, setError] = useState<string>();
  const draftRef = useRef(notes);
  const savedRef = useRef<string | null>(notes);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function save() {
    clearTimeout(timerRef.current);
    timerRef.current = undefined;
    const value = draftRef.current;
    if (value === savedRef.current) {
      return;
    }
    savedRef.current = value;
    setError(undefined);
    try {
      await saveNotes({ submissionId, notes: value });
    } catch (caught) {
      if (savedRef.current === value) {
        savedRef.current = null;
      }
      setError(getErrorMessage(caught));
    }
  }

  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    function saveOnHide() {
      if (document.visibilityState === "hidden") {
        void saveRef.current();
      }
    }
    function saveBeforeUnload(event: BeforeUnloadEvent) {
      void saveRef.current();
      if (convex.connectionState().hasInflightRequests) {
        event.preventDefault();
      }
    }
    function saveOnPageHide() {
      void saveRef.current();
    }
    document.addEventListener("visibilitychange", saveOnHide);
    window.addEventListener("pagehide", saveOnPageHide);
    window.addEventListener("beforeunload", saveBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", saveOnHide);
      window.removeEventListener("pagehide", saveOnPageHide);
      window.removeEventListener("beforeunload", saveBeforeUnload);
      void saveRef.current();
    };
  }, [convex]);

  function change(value: string) {
    setDraft(value);
    draftRef.current = value;
    if (timerRef.current === undefined) {
      timerRef.current = setTimeout(() => void save(), saveDelay);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={fieldId} className="font-semibold">
          Notes
        </Label>
        <span className="text-muted-foreground">Saved automatically</span>
      </div>
      <Textarea
        id={fieldId}
        value={draft}
        maxLength={maxNotesLength}
        aria-describedby={hintId}
        onChange={(event) => change(event.target.value)}
        onBlur={() => void save()}
        className="min-h-28 bg-card leading-relaxed"
      />
      <p id={hintId} className="text-muted-foreground">
        {noStudentNamesHint}
      </p>
      <FormError message={error} />
    </div>
  );
}
