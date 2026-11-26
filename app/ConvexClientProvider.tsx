"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { type ReactNode, useEffect, useState } from "react";
import { env } from "@/lib/env";
import { moveLocalPagesWithoutUser } from "@/lib/local-pages";
import { moveStorageWithoutUser, setStorageUserId } from "@/lib/local-storage";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <WaitForAuth>{children}</WaitForAuth>
    </ConvexProviderWithClerk>
  );
}

function WaitForAuth({ children }: { children: ReactNode }) {
  const { isLoading } = useConvexAuth();
  const { userId } = useAuth();
  const currentUserId = userId ?? null;
  const [readyUserId, setReadyUserId] = useState<string | null>();

  useEffect(() => {
    if (currentUserId) {
      moveStorageWithoutUser(currentUserId);
      moveLocalPagesWithoutUser(currentUserId).catch(() => {});
    }
    setStorageUserId(currentUserId);
    setReadyUserId(currentUserId);
  }, [currentUserId]);

  return isLoading || readyUserId !== currentUserId ? null : children;
}
