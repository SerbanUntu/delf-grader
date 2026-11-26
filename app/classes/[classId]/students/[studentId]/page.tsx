import { auth } from "@clerk/nextjs/server";
import { StudentView } from "./student-view";

export default async function StudentPage({
  params,
}: {
  params: Promise<{ classId: string; studentId: string }>;
}) {
  await auth.protect();
  const { classId, studentId } = await params;
  return <StudentView classId={classId} studentId={studentId} />;
}
