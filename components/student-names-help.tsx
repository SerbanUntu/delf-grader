"use client";

import { QuestionMarkIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useStudentNamesFile } from "@/components/student-names-file";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { readStorageItem, writeStorageItem } from "@/lib/local-storage";
import { useStudentKeys } from "@/lib/students";

const shownStorageName = "student-names-help-shown";

/**
 * The "?" button of the header, which opens the "Import Student Names" dialog explaining how to show student names entered in another browser.
 * The dialog also opens by itself, once per browser, when this browser has no student key but the teacher already has one.
 */
export function StudentNamesHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { key, hasAnyKey } = useStudentKeys();
  const { pickFile, dialogs } = useStudentNamesFile();

  useEffect(() => {
    if (key || hasAnyKey !== true || readStorageItem(shownStorageName)) {
      return;
    }
    try {
      writeStorageItem(shownStorageName, "true");
    } catch {}
    setIsOpen(true);
  }, [key, hasAnyKey]);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label="Student names help"
        title="Student names help"
        onClick={() => setIsOpen(true)}
      >
        <QuestionMarkIcon className="size-5" />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Student Names</DialogTitle>
            <DialogDescription className="text-base">
              Student names never leave the browser where they were entered. The
              server only receives an anonymous ID for each student, made from
              the name and a secret key kept in the browser. To show your
              student names in this browser, follow the option that fits you.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="grid content-start gap-3 rounded-lg border p-4">
              <h3 className="font-semibold">I still have the old browser</h3>
              <ul className="grid list-disc gap-2 pl-5">
                <li>
                  In the old browser, open the user menu (your picture at the
                  top right) and click &quot;Export student names&quot;.
                </li>
                <li>Move the downloaded file to this computer.</li>
                <li>
                  In this browser, open the user menu and click &quot;Import
                  student names&quot;, or use the button below.
                </li>
              </ul>
              <Button
                variant="outline"
                className="justify-self-start"
                onClick={() => {
                  setIsOpen(false);
                  pickFile();
                }}
              >
                Import student names
              </Button>
            </section>
            <section className="grid content-start gap-3 rounded-lg border p-4">
              <h3 className="font-semibold">
                I no longer have the old browser
              </h3>
              <ul className="grid list-disc gap-2 pl-5">
                <li>
                  A new key is created as soon as you enter a student name in
                  this browser.
                </li>
                <li>
                  Past submissions show their student as &quot;Student
                  #a3f9&quot;.
                </li>
                <li>
                  Open one, click &quot;Identify&quot;, type the student&apos;s
                  name and save it. The name then shows on every submission with
                  the same ID.
                </li>
              </ul>
            </section>
          </div>
        </DialogContent>
      </Dialog>
      {dialogs}
    </>
  );
}
