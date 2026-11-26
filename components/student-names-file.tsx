"use client";

import { type ReactNode, useState } from "react";
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
import { getErrorMessage } from "@/lib/errors";
import {
  createStudentNamesFile,
  getStudentNamesFileName,
  readStudentNamesFile,
} from "@/lib/student-names-file";
import {
  readStudentNamesData,
  type StudentNamesData,
  useStudentKeys,
} from "@/lib/students";

type Message = { title: string; text: string };

function downloadFile(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function describeImport(data: StudentNamesData, addedCount: number): string {
  const namesText =
    Object.keys(data.names).length === 0
      ? "The file holds no student names."
      : addedCount === 0
        ? "All student names in the file were already in this browser."
        : addedCount === 1
          ? "1 student name was added to this browser."
          : `${addedCount} student names were added to this browser.`;
  return data.key
    ? `${namesText} Student names entered here from now on use the imported student key.`
    : namesText;
}

/**
 * Exports and imports the student names file, which holds the secret student key and the student names of this browser.
 *
 * @returns A function that downloads the file, a function that asks the teacher to pick a file to import, and the dialogs to render.
 */
export function useStudentNamesFile(): {
  exportNames: () => void;
  pickFile: () => void;
  dialogs: ReactNode;
} {
  const { importStudentNames } = useStudentKeys();
  const [pendingData, setPendingData] = useState<StudentNamesData>();
  const [message, setMessage] = useState<Message>();

  async function applyImport(data: StudentNamesData) {
    try {
      const addedCount = await importStudentNames(data);
      setMessage({
        title: "Student names imported",
        text: describeImport(data, addedCount),
      });
    } catch (error) {
      setMessage({ title: "Import failed", text: getErrorMessage(error) });
    }
  }

  async function handleFile(file: File) {
    let data: StudentNamesData;
    try {
      data = await readStudentNamesFile(file);
    } catch (error) {
      setMessage({ title: "Import failed", text: getErrorMessage(error) });
      return;
    }
    const currentKey = readStudentNamesData().key;
    if (data.key && currentKey && data.key !== currentKey) {
      setPendingData(data);
      return;
    }
    await applyImport(data);
  }

  function exportNames() {
    const data = readStudentNamesData();
    if (!data.key && Object.keys(data.names).length === 0) {
      setMessage({
        title: "Nothing to export",
        text: "No student names have been entered in this browser yet.",
      });
      return;
    }
    downloadFile(createStudentNamesFile(data), getStudentNamesFileName());
  }

  function pickFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip,application/zip";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) {
        void handleFile(file);
      }
    });
    input.click();
  }

  const dialogs = (
    <>
      <ConfirmDialog
        open={pendingData !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setPendingData(undefined);
          }
        }}
        title="Replace the student key of this browser?"
        description="This browser already has a different student key. The imported key replaces it, so names entered here from now on give the same anonymous IDs as in the browser the file came from. Student names already in this browser are kept. If you may need the current key again, cancel and export the student names of this browser first."
        confirmLabel="Replace key"
        onConfirm={async () => {
          if (pendingData) {
            await applyImport(pendingData);
          }
        }}
      />
      <Dialog
        open={message !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setMessage(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{message?.title}</DialogTitle>
            <DialogDescription className="text-base">
              {message?.text}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setMessage(undefined)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return { exportNames, pickFile, dialogs };
}
