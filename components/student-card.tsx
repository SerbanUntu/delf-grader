"use client";

import { ItemCard } from "@/components/item-card";
import { IdentifyButton } from "@/components/student-label";
import { formatDate } from "@/lib/format";
import { unknownStudentLabel } from "@/lib/student-ids";
import { getStudentHref, useStudentName } from "@/lib/students";

/**
 * The card of a student in a class, with their name, the number of graded submissions and the score of the newest one.
 *
 * @param student The student ID, the number of graded submissions, and the exam date and score of the newest one.
 * @param classId The ID of the class.
 */
export function StudentCard({
  student,
  classId,
}: {
  student: {
    studentId: string;
    gradedCount: number;
    examDate: string;
    score: number;
  };
  classId: string;
}) {
  const name = useStudentName(student.studentId);

  return (
    <ItemCard
      href={getStudentHref(classId, student.studentId)}
      title={name ?? unknownStudentLabel(student.studentId)}
      details={
        <>
          {!name && (
            <div className="mb-2">
              <IdentifyButton studentId={student.studentId} classId={classId} />
            </div>
          )}
          <p>
            {student.gradedCount} graded{" "}
            {student.gradedCount === 1 ? "submission" : "submissions"}
          </p>
          <p>Newest exam: {formatDate(student.examDate)}</p>
        </>
      }
      score={student.score}
    />
  );
}
