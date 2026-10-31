"use client";

import { useMutation } from "convex/react";
import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/errors";
import { maxTranscriptionLength } from "@/lib/format";
import { countWords } from "@/lib/word-count";
import { StepHeading } from "./step-heading";
import { RerunDescription, StepFailed, StepInProgress } from "./step-status";

/**
 * The transcription step, where the teacher checks the transcribed text and fixes transcription mistakes.
 *
 * @param submissionId The submission ID.
 * @param transcription The transcription of the submission, or undefined if it has not started.
 * @param minimumWords The minimum number of words asked for by the rubric.
 * @param stepsToRerun The steps that will be re-run if the text is changed.
 */
export function TranscriptionStep({
  submissionId,
  transcription,
  minimumWords,
  stepsToRerun,
}: {
  submissionId: Id<"submissions">;
  transcription: Doc<"submissions">["transcription"];
  minimumWords: number;
  stepsToRerun: string[];
}) {
  if (transcription?.status === "done") {
    return (
      <section className="grid gap-5">
        <StepHeading title="Transcription">
          Compare the text with the pages and fix any transcription mistakes.
          Keep the student&apos;s own mistakes, because they are graded.
        </StepHeading>
        <TranscriptionEditor
          key={transcription.text}
          submissionId={submissionId}
          text={transcription.text}
          minimumWords={minimumWords}
          stepsToRerun={stepsToRerun}
        />
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <StepHeading title="Transcription" />
      {transcription?.status === "inProgress" && (
        <StepInProgress>
          Transcribing the pages. This usually takes under a minute, and you can
          leave this page in the meantime.
        </StepInProgress>
      )}
      {transcription?.status === "failed" && (
        <StepFailed error={transcription.error} />
      )}
      {transcription === undefined && (
        <p className="text-muted-foreground">
          The transcription starts once the redacted images are saved.
        </p>
      )}
    </section>
  );
}

function TranscriptionEditor({
  submissionId,
  text,
  minimumWords,
  stepsToRerun,
}: {
  submissionId: Id<"submissions">;
  text: string;
  minimumWords: number;
  stepsToRerun: string[];
}) {
  const saveTranscription = useMutation(api.transcription.save);
  const textAreaId = useId();
  const [draft, setDraft] = useState(text);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const isChanged = draft.trim() !== text;
  const wordCount = countWords(draft);

  async function save() {
    setError(undefined);
    setIsSaving(true);
    try {
      await saveTranscription({ submissionId, text: draft });
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={textAreaId} className="text-base font-semibold">
          Transcribed text
        </Label>
        <span className="text-muted-foreground">
          {wordCount} {wordCount === 1 ? "word" : "words"} (at least{" "}
          {minimumWords} expected)
        </span>
      </div>
      <Textarea
        id={textAreaId}
        value={draft}
        maxLength={maxTranscriptionLength}
        spellCheck={false}
        onChange={(event) => setDraft(event.target.value)}
        className="min-h-[28rem] bg-card text-base leading-relaxed"
      />
      <FormError message={error} />
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={!isChanged || isSaving}
          onClick={() => {
            if (stepsToRerun.length > 0) {
              setIsConfirming(true);
            } else {
              void save();
            }
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button
          variant="outline"
          disabled={!isChanged || isSaving}
          onClick={() => {
            setDraft(text);
            setError(undefined);
          }}
        >
          Undo changes
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title="Save the transcription?"
        description={
          <RerunDescription
            action="Saving the changed text"
            steps={stepsToRerun}
          />
        }
        onConfirm={save}
      />
    </div>
  );
}
