"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";
import { env } from "@/lib/env";

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
  return isLoading ? null : children;
}
