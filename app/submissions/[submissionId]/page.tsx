import { auth } from "@clerk/nextjs/server";
import { SubmissionView } from "./submission-view";

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  await auth.protect();
  const { submissionId } = await params;
  return <SubmissionView submissionId={submissionId} />;
}
