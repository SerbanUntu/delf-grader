import { SubmissionView } from "./submission-view";

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <SubmissionView submissionId={submissionId} />;
}
