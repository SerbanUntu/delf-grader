import type { GoogleLanguageModelOptions } from "@ai-sdk/google";
import { generateText, type ImagePart, type TextPart } from "ai";
import { ConvexError, v } from "convex/values";
import { maxTranscriptionLength } from "../lib/format";
import { countWords } from "../lib/word-count";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  type ActionCtx,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { requireOwned } from "./access";
import { describeStepFailure, getTranscriberModel } from "./ai";
import { isCurrentRun, startGrading } from "./model";

const transcriberInstructions = `You transcribe handwritten answers to a DELF Production écrite exam. They are written in French by students who are learning French.

## Rules

- Copy the text exactly as written, including every spelling, grammar, accent, capitalization and punctuation mistake. Never correct, improve, complete or translate the student's text.
- Keep the student's paragraphs, separated by one blank line. Within a paragraph, join the lines that only break because the line on the page ended. Join a word that is split across two lines with a hyphen at the end of the first line, unless the hyphen belongs to the word (as in "rendez-vous").
- Leave out text that the student crossed out.
- Write [illegible] in place of each word you cannot read. Do not guess.
- The pages are given in order. Transcribe them one after the other as one continuous text, without page numbers or page markers.
- Leave out everything that is not part of the student's answer, such as printed instructions, page numbers, notes or marks added by a teacher, and the black rectangles that hide personal information.

## Output

Return only the transcribed text, with no title, comment or formatting. If the pages hold no answer at all, return an empty response.`;

async function readPages(
  ctx: ActionCtx,
  pageIds: Id<"_storage">[],
): Promise<(TextPart | ImagePart)[]> {
  const parts: (TextPart | ImagePart)[] = [];
  for (const [index, pageId] of pageIds.entries()) {
    const page = await ctx.storage.get(pageId);
    if (!page) {
      throw new Error("A page image is missing. Upload the submission again.");
    }
    parts.push(
      { type: "text", text: `Page ${index + 1} of ${pageIds.length}:` },
      {
        type: "image",
        image: new Uint8Array(await page.arrayBuffer()),
        mediaType: "image/jpeg",
      },
    );
  }
  return parts;
}

export const getPageIds = internalQuery({
  args: { submissionId: v.id("submissions"), startedAt: v.number() },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get("submissions", args.submissionId);
    if (
      !submission ||
      !isCurrentRun(submission.transcription, args.startedAt)
    ) {
      return null;
    }
    return submission.pageIds ?? [];
  },
});

export const transcribe = internalAction({
  args: { submissionId: v.id("submissions"), startedAt: v.number() },
  handler: async (ctx, args) => {
    const pageIds: Id<"_storage">[] | null = await ctx.runQuery(
      internal.transcription.getPageIds,
      args,
    );
    if (!pageIds) {
      return null;
    }
    try {
      if (pageIds.length === 0) {
        throw new Error("There are no saved pages to transcribe.");
      }
      const { text } = await generateText({
        model: getTranscriberModel(),
        instructions: transcriberInstructions,
        messages: [{ role: "user", content: await readPages(ctx, pageIds) }],
        providerOptions: {
          google: {
            thinkingConfig: { thinkingLevel: "low" },
            mediaResolution: "MEDIA_RESOLUTION_HIGH",
          } satisfies GoogleLanguageModelOptions,
        },
      });
      await ctx.runMutation(internal.transcription.complete, {
        ...args,
        text: text.trim().slice(0, maxTranscriptionLength),
      });
    } catch (error) {
      await ctx.runMutation(internal.transcription.fail, {
        ...args,
        error: describeStepFailure("transcription", error),
      });
    }
    return null;
  },
});

export const complete = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    startedAt: v.number(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get("submissions", args.submissionId);
    if (
      !submission ||
      !isCurrentRun(submission.transcription, args.startedAt)
    ) {
      return null;
    }
    await ctx.db.patch("submissions", submission._id, {
      transcription: {
        status: "done",
        text: args.text,
        wordCount: countWords(args.text),
      },
    });
    await startGrading(ctx, submission._id);
    return null;
  },
});

export const fail = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    startedAt: v.number(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get("submissions", args.submissionId);
    if (
      !submission ||
      !isCurrentRun(submission.transcription, args.startedAt)
    ) {
      return null;
    }
    await ctx.db.patch("submissions", submission._id, {
      transcription: { status: "failed", error: args.error },
    });
    return null;
  },
});

export const save = mutation({
  args: { submissionId: v.id("submissions"), text: v.string() },
  handler: async (ctx, args) => {
    const submission = await requireOwned(
      ctx,
      "submissions",
      args.submissionId,
    );
    if (submission.transcription?.status !== "done") {
      throw new ConvexError(
        "The transcription can only be changed once it is done.",
      );
    }
    const text = args.text.trim();
    if (text.length > maxTranscriptionLength) {
      throw new ConvexError(
        `The transcription must be at most ${maxTranscriptionLength} characters long.`,
      );
    }
    if (text === submission.transcription.text) {
      return null;
    }
    await ctx.db.patch("submissions", submission._id, {
      transcription: { status: "done", text, wordCount: countWords(text) },
    });
    await startGrading(ctx, submission._id);
    return null;
  },
});
