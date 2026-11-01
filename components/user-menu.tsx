"use client";

import { UserButton } from "@clerk/nextjs";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { StudentKeyDialog } from "@/components/student-key-dialog";

/**
 * The user menu, with the account settings, signing out and the student key.
 */
export function UserMenu() {
  const [isShowingKey, setIsShowingKey] = useState(false);

  return (
    <>
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Action
            label="Student key"
            labelIcon={<LockClosedIcon />}
            onClick={() => setIsShowingKey(true)}
          />
        </UserButton.MenuItems>
      </UserButton>
      <StudentKeyDialog open={isShowingKey} onOpenChange={setIsShowingKey} />
    </>
  );
}
