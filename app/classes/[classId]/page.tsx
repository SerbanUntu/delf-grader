import { auth } from "@clerk/nextjs/server";
import { ClassView } from "./class-view";

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  await auth.protect();
  const { classId } = await params;
  return <ClassView classId={classId} />;
}
