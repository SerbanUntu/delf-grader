import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { rubricIdValidator } from "../lib/rubrics";

export const examFields = {
  examDate: v.string(),
  rubricId: rubricIdValidator,
  question: v.string(),
};

const submissionFields = {
  teacherId: v.string(),
  classId: v.id("classes"),
  name: v.string(),
  uploadedAt: v.optional(v.number()),
  pageIds: v.optional(v.array(v.id("_storage"))),
};

export default defineSchema({
  classes: defineTable({
    teacherId: v.string(),
    name: v.string(),
  }).index("by_teacherId", ["teacherId"]),

  sessions: defineTable({
    teacherId: v.string(),
    classId: v.id("classes"),
    name: v.optional(v.string()),
    ...examFields,
  }).index("by_classId_and_examDate", ["classId", "examDate"]),

  submissions: defineTable(
    v.union(
      v.object({
        kind: v.literal("session"),
        sessionId: v.id("sessions"),
        ...submissionFields,
      }),
      v.object({
        kind: v.literal("individual"),
        ...submissionFields,
        ...examFields,
      }),
    ),
  )
    .index("by_sessionId", ["sessionId"])
    .index("by_classId_and_kind_and_examDate", ["classId", "kind", "examDate"]),
});
