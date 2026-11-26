"use client";

import { UserButton } from "@clerk/nextjs";
import { DownloadIcon, UploadIcon } from "@radix-ui/react-icons";
import { useStudentNamesFile } from "@/components/student-names-file";

/**
 * The user menu, with the account settings, signing out and exporting or importing student names.
 */
export function UserMenu() {
  const { exportNames, pickFile, dialogs } = useStudentNamesFile();

  return (
    <>
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Action
            label="Export student names"
            labelIcon={<DownloadIcon />}
            onClick={exportNames}
          />
          <UserButton.Action
            label="Import student names"
            labelIcon={<UploadIcon />}
            onClick={pickFile}
          />
        </UserButton.MenuItems>
      </UserButton>
      {dialogs}
    </>
  );
}
