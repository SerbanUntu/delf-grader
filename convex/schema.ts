import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { gradingResultValidator } from "../lib/grading";
import { rubricIdValidator } from "../lib/rubrics";

export const examFields = {
  examDate: v.string(),
  rubricId: rubricIdValidator,
  question: v.string(),
};

const inProgressStep = v.object({
  status: v.literal("inProgress"),
  startedAt: v.number(),
});

const failedStep = v.object({
  status: v.literal("failed"),
  error: v.string(),
});

const submissionFields = {
  teacherId: v.string(),
  classId: v.id("classes"),
  name: v.string(),
  uploadedAt: v.optional(v.number()),
  uploadUrlsCreatedAt: v.optional(v.number()),
  pageIds: v.optional(v.array(v.id("_storage"))),
  transcription: v.optional(
    v.union(
      inProgressStep,
      v.object({
        status: v.literal("done"),
        text: v.string(),
        wordCount: v.number(),
      }),
      failedStep,
    ),
  ),
  grading: v.optional(
    v.union(
      inProgressStep,
      v.object({ status: v.literal("done"), result: gradingResultValidator }),
      failedStep,
    ),
  ),
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

  pages: defineTable({
    submissionId: v.id("submissions"),
    storageId: v.id("_storage"),
  }).index("by_storageId", ["storageId"]),
});
