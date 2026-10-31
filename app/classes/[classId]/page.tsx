import { ClassView } from "./class-view";

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return <ClassView classId={classId} />;
}
