"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NameDialog } from "@/components/name-dialog";
import { StudentDialog } from "@/components/submission-dialogs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  classNamePlaceholder,
  defaultSessionName,
  defaultSubmissionName,
  submissionNameHint,
} from "@/lib/format";
import { deleteLocalPages } from "@/lib/local-pages";
import { useStudentKeys } from "@/lib/students";

type ItemActionsProps = {
  itemType: "class" | "session" | "submission";
  itemName: string;
  rename: {
    label?: string;
    initialName: string;
    placeholder: string;
    required?: boolean;
    hint?: string;
    onSave: (name: string) => Promise<unknown>;
  };
  deletion: {
    description: string;
    onConfirm: () => Promise<unknown>;
  };
  menuItems?: ReactNode;
};

/**
 * A menu to rename or delete a class, session or submission, with their dialogs.
 *
 * @param itemType The kind of item, shown in the menu and dialogs, such as "Rename session".
 * @param itemName The current name of the item, used to label the menu button.
 * @param rename The rename dialog.
 * @param deletion The delete confirmation dialog.
 * @param menuItems More menu items, shown between "Rename" and "Delete".
 */
export function ItemActions({
  itemType,
  itemName,
  rename,
  deletion,
  menuItems,
}: ItemActionsProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${itemName}`}
          >
            <DotsHorizontalIcon className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-base"
            onSelect={() => setIsRenaming(true)}
          >
            Rename {itemType}
          </DropdownMenuItem>
          {menuItems}
          <DropdownMenuItem
            className="text-base text-destructive focus:text-destructive"
            onSelect={() => setIsDeleting(true)}
          >
            Delete {itemType}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NameDialog
        open={isRenaming}
        onOpenChange={setIsRenaming}
        title={`Rename ${itemType}`}
        label={rename.label}
        initialName={rename.initialName}
        placeholder={rename.placeholder}
        required={rename.required}
        hint={rename.hint}
        onSave={rename.onSave}
      />
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title={`Delete this ${itemType}?`}
        description={deletion.description}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deletion.onConfirm();
        }}
      />
    </>
  );
}

function useDeleteAndLeave(redirectTo: string | undefined) {
  const router = useRouter();
  return async (remove: () => Promise<string | string[]>) => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
    const deletedSubmissionIds = await remove();
    await deleteLocalPages(
      Array.isArray(deletedSubmissionIds)
        ? deletedSubmissionIds
        : [deletedSubmissionIds],
    ).catch(() => undefined);
  };
}

/**
 * The rename and delete menu of a class.
 *
 * @param schoolClass The class.
 * @param redirectTo The page to open before the class is deleted, when the menu is on the class's own page.
 */
export function ClassActions({
  schoolClass,
  redirectTo,
}: {
  schoolClass: Doc<"classes">;
  redirectTo?: string;
}) {
  const renameClass = useMutation(api.classes.rename);
  const removeClass = useMutation(api.classes.remove);
  const deleteAndLeave = useDeleteAndLeave(redirectTo);

  return (
    <ItemActions
      itemType="class"
      itemName={schoolClass.name}
      rename={{
        initialName: schoolClass.name,
        placeholder: classNamePlaceholder,
        required: true,
        onSave: (name) => renameClass({ classId: schoolClass._id, name }),
      }}
      deletion={{
        description: `"${schoolClass.name}" will be deleted with all of its sessions and submissions. This cannot be undone.`,
        onConfirm: () =>
          deleteAndLeave(() => removeClass({ classId: schoolClass._id })),
      }}
    />
  );
}

/**
 * The rename and delete menu of a session.
 *
 * @param session The session, with its display name.
 * @param schoolClassName The name of the session's class, used for the default session name.
 * @param redirectTo The page to open before the session is deleted, when the menu is on the session's own page.
 */
export function SessionActions({
  session,
  schoolClassName,
  redirectTo,
}: {
  session: Doc<"sessions"> & { displayName: string };
  schoolClassName: string;
  redirectTo?: string;
}) {
  const renameSession = useMutation(api.sessions.rename);
  const removeSession = useMutation(api.sessions.remove);
  const deleteAndLeave = useDeleteAndLeave(redirectTo);

  return (
    <ItemActions
      itemType="session"
      itemName={session.displayName}
      rename={{
        label: "Name (optional)",
        initialName: session.name ?? "",
        placeholder: defaultSessionName(schoolClassName, session.examDate),
        onSave: (name) => renameSession({ sessionId: session._id, name }),
      }}
      deletion={{
        description: `"${session.displayName}" will be deleted with all of its submissions. This cannot be undone.`,
        onConfirm: () =>
          deleteAndLeave(() => removeSession({ sessionId: session._id })),
      }}
    />
  );
}

/**
 * The rename and delete menu of a submission.
 *
 * @param submission The submission.
 * @param redirectTo The page to open before the submission is deleted, when the menu is on the submission's own page.
 */
export function SubmissionActions({
  submission,
  redirectTo,
}: {
  submission: Doc<"submissions">;
  redirectTo?: string;
}) {
  const renameSubmission = useMutation(api.submissions.rename);
  const removeSubmission = useMutation(api.submissions.remove);
  const changeStudent = useMutation(api.submissions.changeStudent);
  const { toStudentId } = useStudentKeys();
  const deleteAndLeave = useDeleteAndLeave(redirectTo);
  const [isChangingStudent, setIsChangingStudent] = useState(false);

  return (
    <>
      <ItemActions
        itemType="submission"
        itemName={submission.name}
        rename={{
          label: "Submission name",
          initialName: submission.name,
          placeholder: defaultSubmissionName,
          hint: submissionNameHint,
          onSave: (name) =>
            renameSubmission({ submissionId: submission._id, name }),
        }}
        deletion={{
          description: `"${submission.name}" will be deleted. This cannot be undone.`,
          onConfirm: () =>
            deleteAndLeave(() =>
              removeSubmission({ submissionId: submission._id }),
            ),
        }}
        menuItems={
          <DropdownMenuItem
            className="text-base"
            onSelect={() => setIsChangingStudent(true)}
          >
            Change student
          </DropdownMenuItem>
        }
      />
      <StudentDialog
        open={isChangingStudent}
        onOpenChange={setIsChangingStudent}
        classId={submission.classId}
        onSave={async (studentName) =>
          changeStudent({
            submissionId: submission._id,
            studentId: await toStudentId(submission.classId, studentName),
          })
        }
      />
    </>
  );
}
