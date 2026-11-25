import { auth } from "@clerk/nextjs/server";
import { SessionView } from "./session-view";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await auth.protect();
  const { sessionId } = await params;
  return <SessionView sessionId={sessionId} />;
}
