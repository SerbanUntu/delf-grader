import {
  generateText,
  type ModelMessage,
  NoObjectGeneratedError,
  Output,
} from "ai";
import { v } from "convex/values";
import { formatNumber } from "../lib/format";
import {
  buildGraderSchema,
  computeGradingResult,
  GraderAnswerError,
  type GradingResult,
  getAutomaticZeroReason,
  getGradedCriteria,
  gradingResultValidator,
} from "../lib/grading";
import { getRubric, type Rubric, type RubricId } from "../lib/rubrics";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { describeStepFailure, getGraderModel } from "./ai";
import { getExam, isCurrentRun } from "./model";

const maxAttempts = 3;

const commonInstructions = `You are an experienced DELF examiner. You grade one Production écrite paper, written by a student who is learning French, using the rubric below.

# Input

You receive the exam question, the word count of the student's text and the student's text. The word count is computed by code, so do not count words yourself. The paper was handwritten and then transcribed, so the text is exactly what the student wrote, mistakes included.

# Text type

Infer the text type the exam question asks for. DELF questions almost always name it. Write it in French and in lowercase, as the question names it, for example "courriel", "lettre formelle", "article", "message sur un forum", "essai" or "contribution à un débat". If the question does not name it, choose the type that best fits the task.

Check the paper against the conventions of its text type:

- Courriel or lettre amicale: a greeting and a closing suited to the reader (for example "Salut Marie," and "Bises,"), tutoiement or vouvoiement suited to the relationship, and a signature. The register is informal or neutral.
- Lettre formelle (lettre de réclamation, de motivation, de demande, etc.): the sender's and the recipient's details, place and date, a subject line ("Objet : ..."), an opening such as "Madame, Monsieur,", vouvoiement throughout, a formal closing (formule de politesse, such as "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.") and a signature. The register is formal.
- Article, including article critique: a title, an introduction that presents the topic and draws the reader in, developed paragraphs and a conclusion. It addresses a wide readership, usually in a neutral register.
- Message sur un forum or blog: replies to the topic or to an earlier message, in a personal tone, and may be signed with a pseudonym. Letter formulas are not required.
- Essai or contribution à un débat: states the issue (la problématique) and the writer's position, develops structured arguments with examples, and ends with a conclusion, following an introduction, développement and conclusion.
- Récit or témoignage: tells events or experiences in a clear order, mostly in past tenses.

For any other text type, use the conventions a DELF examiner would expect.

# Deductions

For each criterion, start from its maximum score and list the deductions. Each deduction removes a number of points and gives the reason.

- Leave the list of a criterion empty only when the paper fully meets the highest level of that criterion.
- The points removed from a criterion must leave one of its allowed scores, listed under "Answer format". Any other total is rejected.
- Grade each criterion only on what it covers, and do not remove points twice for the same mistake under two criteria.
- Group mistakes of the same kind into one deduction instead of writing one deduction per mistake. Order the deductions from the most to the fewest points removed.
- Judge the paper against the level the rubric targets, not against a native speaker. Mistakes that the descriptors accept at this level do not remove points on their own.

# Reasons

- Write each reason in English, in one or two short sentences, for a teacher who may not speak French.
- Quote the student's text in French, exactly as transcribed, between double quotes. When there is a correction, give it after the quote, for example: "il faut que je vais" should be "il faut que j'aille" (subjunctive after "il faut que").
- When one deduction covers several mistakes of the same kind, quote up to three examples.

# Illegible words

[illegible] marks a word that could not be read from the handwriting. It says nothing about the student's French. Do not remove points for it, do not quote it as a mistake and do not guess what it says. Grade every criterion on the readable parts of the text.

# Anomalies

Report every anomaly from the rubric that applies, using the IDs listed under "Answer format", and report none if the paper has none. Do not lower any score because of an anomaly yourself, as any fixed penalty is applied by code.`;

function describeAnswerFormat(rubric: Rubric): string {
  const criteria = getGradedCriteria(rubric).map((criterion) => {
    const allowed = criterion.levels
      .map((level) => formatNumber(level.score))
      .join(", ");
    return `- "${criterion.id}": ${criterion.frenchName} (${criterion.englishSubtitle}), out of ${formatNumber(criterion.maxScore)}. Allowed scores: ${allowed}.`;
  });
  const anomalies = rubric.anomalies.map(
    (anomaly) =>
      `- "${anomaly.id}": ${anomaly.frenchName} (${anomaly.englishSubtitle})`,
  );
  const lengthCriterion = rubric.criteria.find(
    (criterion) => criterion.id === rubric.lengthRule?.criterionId,
  );
  const lengthNote = lengthCriterion
    ? `\n\n${lengthCriterion.frenchName} is scored by code from the word count, so it is not part of your answer.`
    : "";
  return `# Answer format

Give the deductions under these criterion IDs:

${criteria.join("\n")}${lengthNote}

Anomaly IDs:

${anomalies.join("\n")}`;
}

function buildInstructions(rubric: Rubric): string {
  return `${commonInstructions}

# Rubric

${rubric.systemPrompt}

${describeAnswerFormat(rubric)}`;
}

function buildPrompt(
  rubric: Rubric,
  question: string,
  text: string,
  wordCount: number,
): string {
  return `<exam_question>
${question}
</exam_question>

<word_count>
${wordCount} words. The rubric asks for at least ${rubric.minimumWords} words.
</word_count>

<student_text>
${text}
</student_text>`;
}

async function gradeText(input: {
  rubricId: RubricId;
  question: string;
  text: string;
  wordCount: number;
}): Promise<GradingResult> {
  const rubric = getRubric(input.rubricId);
  if (getAutomaticZeroReason(rubric, input.wordCount)) {
    return computeGradingResult(rubric, input.wordCount, null);
  }
  const schema = buildGraderSchema(rubric);
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: buildPrompt(rubric, input.question, input.text, input.wordCount),
    },
  ];
  let lastProblem = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { output } = await generateText({
        model: getGraderModel(),
        instructions: {
          role: "system",
          content: buildInstructions(rubric),
          providerOptions: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
        messages,
        output: Output.object({ schema }),
      });
      try {
        return computeGradingResult(rubric, input.wordCount, output);
      } catch (error) {
        if (!(error instanceof GraderAnswerError)) {
          throw error;
        }
        lastProblem = error.message;
        messages.push(
          { role: "assistant", content: JSON.stringify(output) },
          {
            role: "user",
            content: `Your answer was rejected: ${error.message} Grade the paper again, so that the deductions under every criterion leave one of its allowed scores.`,
          },
        );
      }
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) {
        throw error;
      }
      lastProblem = "The answer did not match the required format.";
    }
  }
  throw new Error(
    `The grader gave an answer that could not be used ${maxAttempts} times in a row. ${lastProblem}`,
  );
}

export const getInput = internalQuery({
  args: { submissionId: v.id("submissions"), startedAt: v.number() },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get("submissions", args.submissionId);
    if (
      !submission ||
      !isCurrentRun(submission.grading, args.startedAt) ||
      submission.transcription?.status !== "done"
    ) {
      return null;
    }
    const exam = await getExam(ctx, submission);
    if (!exam) {
      return null;
    }
    return {
      rubricId: exam.rubricId,
      question: exam.question,
      text: submission.transcription.text,
      wordCount: submission.transcription.wordCount,
    };
  },
});

export const grade = internalAction({
  args: { submissionId: v.id("submissions"), startedAt: v.number() },
  handler: async (ctx, args) => {
    const input: {
      rubricId: RubricId;
      question: string;
      text: string;
      wordCount: number;
    } | null = await ctx.runQuery(internal.grading.getInput, args);
    if (!input) {
      return null;
    }
    try {
      const result = await gradeText(input);
      await ctx.runMutation(internal.grading.complete, { ...args, result });
    } catch (error) {
      await ctx.runMutation(internal.grading.fail, {
        ...args,
        error: describeStepFailure("grading", error),
      });
    }
    return null;
  },
});

export const complete = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    startedAt: v.number(),
    result: gradingResultValidator,
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get("submissions", args.submissionId);
    if (!submission || !isCurrentRun(submission.grading, args.startedAt)) {
      return null;
    }
    await ctx.db.patch("submissions", submission._id, {
      grading: { status: "done", result: args.result },
    });
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
    if (!submission || !isCurrentRun(submission.grading, args.startedAt)) {
      return null;
    }
    await ctx.db.patch("submissions", submission._id, {
      grading: { status: "failed", error: args.error },
    });
    return null;
  },
});
