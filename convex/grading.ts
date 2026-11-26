import {
  generateText,
  type ModelMessage,
  NoObjectGeneratedError,
  Output,
} from "ai";
import { ConvexError, v } from "convex/values";
import { formatNumber } from "../lib/format";
import {
  buildGraderSchema,
  computeGradingResult,
  formatAllowedScores,
  GraderAnswerError,
  type GradingResult,
  getAutomaticZeroReason,
  getGradedCriteria,
  gradingResultValidator,
} from "../lib/grading";
import {
  defaultFeedbackLanguage,
  type FeedbackLanguage,
  feedbackLanguageNames,
  feedbackLanguageValidator,
} from "../lib/languages";
import { getRubric, type Rubric, type RubricId } from "../lib/rubrics";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { requireOwned } from "./access";
import { describeStepFailure, getGraderModel } from "./ai";
import { getExam, isCurrentRun, startGrading } from "./model";

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

# Grading each criterion

Grade each criterion in three steps, in this order:

1. Compare: compare the paper with the descriptors of the criterion, following the rubric's rules for choosing a level or score, and write a short comparison that quotes the student's text as evidence.
2. Choose: give the score the comparison leads to. It must be one of the criterion's allowed scores, listed under "Answer format". Base it only on the descriptors and the rubric's rules, not on an overall impression of the paper, so that grading the same paper again gives the same score.
3. Deduct: list the deductions that explain the gap between the criterion's maximum and the chosen score. Each deduction removes a number of points and gives the reason. The points must add up exactly to the gap, and there are no deductions when the chosen score is the maximum.

Then write the criterion's overview, as described under "Overviews".

Also follow these rules:

- Judge what the paper shows the student can do, against the level the rubric targets, not against a native speaker. Mistakes that the descriptors accept at this level do not lower the score on their own.
- Grade each criterion only on what it covers. A weak criterion does not lower another one, a strong criterion does not raise another one, and the same mistake is never counted under two criteria.
- Mistakes in how a word is spelled in the dictionary, including accents, belong to the criterion that covers vocabulary or spelling. Mistakes in agreement, in conjugation and in the gender of articles belong to the criterion that covers grammar.
- A text longer than the minimum length is never penalized.
- Group mistakes of the same kind into one deduction instead of writing one deduction per mistake. Order the deductions from the most to the fewest points removed.

# Overviews

Overviews are feedback for the student. They never change a score, so write them only once the scores and deductions are final.

- Criterion overview: for each criterion, write two to four sentences. Start with what the student did well under this criterion, quoting one or two examples from their text. Then mention every mistake under this criterion that did not cost points, with its correction, even when the criterion has its full points. Do not repeat the mistakes already given as deductions. If the student did nothing well under the criterion, say what they should work on first instead.
- Paper overview: write two to four sentences on the main strengths and weaknesses of the whole paper, so the student knows what to keep doing and what to work on first.

# Reasons and overviews

- Write reasons and overviews in the language given under "Feedback language". Each reason is one or two short sentences.
- Quote the student's text in French, exactly as transcribed, between double quotes. When there is a correction, give it after the quote, for example: "il faut que je vais" should be "il faut que j'aille" (subjunctive after "il faut que").
- When one deduction or overview covers several mistakes of the same kind, quote up to three examples.

# Illegible words

[illegible] marks a word that could not be read from the handwriting. It says nothing about the student's French. Do not remove points for it, do not quote it as a mistake and do not guess what it says. Grade every criterion on the readable parts of the text.

# Anomalies

Report every anomaly from the rubric that applies, using the IDs listed under "Answer format", and report none if the paper has none. Do not lower any score because of an anomaly yourself, as any fixed penalty is applied by code.`;

function describeAnswerFormat(rubric: Rubric): string {
  const criteria = getGradedCriteria(rubric).map(
    (criterion) =>
      `- "${criterion.id}": ${criterion.frenchName} (${criterion.englishSubtitle}), out of ${formatNumber(criterion.maxScore)}. Allowed scores: ${formatAllowedScores(criterion)}.`,
  );
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

Grade these criteria, under their IDs:

${criteria.join("\n")}${lengthNote}

Anomaly IDs:

${anomalies.join("\n")}`;
}

function describeFeedbackLanguage(language: FeedbackLanguage): string {
  const languageName = feedbackLanguageNames[language];
  return `# Feedback language

Write every reason, every criterion overview and the paper overview in ${languageName}, because the student reads them in ${languageName}. Keep quotes of the student's text in French, exactly as transcribed, and keep DELF terms in French: criterion, level and anomaly names, and the text type. Write the comparisons in English, whatever the feedback language.`;
}

function buildInstructions(rubric: Rubric, language: FeedbackLanguage): string {
  return `${commonInstructions}

# Rubric

${rubric.systemPrompt}

${describeAnswerFormat(rubric)}

${describeFeedbackLanguage(language)}`;
}

function buildPrompt(
  rubric: Rubric,
  question: string,
  text: string,
  wordCount: number,
  language: FeedbackLanguage,
): string {
  return `<exam_question>
${question}
</exam_question>

<word_count>
${wordCount} words. The rubric asks for at least ${rubric.minimumWords} words.
</word_count>

<student_text>
${text}
</student_text>

Write the reasons and overviews in ${feedbackLanguageNames[language]}.`;
}

type GradingInput = {
  rubricId: RubricId;
  question: string;
  text: string;
  wordCount: number;
  language: FeedbackLanguage;
};

async function gradeText(input: GradingInput): Promise<GradingResult> {
  const rubric = getRubric(input.rubricId);
  const { language } = input;
  if (getAutomaticZeroReason(rubric, input.wordCount, language)) {
    return computeGradingResult(rubric, input.wordCount, null, language);
  }
  const schema = buildGraderSchema(rubric, language);
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: buildPrompt(
        rubric,
        input.question,
        input.text,
        input.wordCount,
        language,
      ),
    },
  ];
  let lastProblem = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { output } = await generateText({
        model: getGraderModel(),
        instructions: {
          role: "system",
          content: buildInstructions(rubric, language),
          providerOptions: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
        messages,
        output: Output.object({ schema }),
        providerOptions: { anthropic: { effort: "high" } },
      });
      try {
        return computeGradingResult(rubric, input.wordCount, output, language);
      } catch (error) {
        if (!(error instanceof GraderAnswerError)) {
          throw error;
        }
        lastProblem = error.message;
        messages.push(
          { role: "assistant", content: JSON.stringify(output) },
          {
            role: "user",
            content: `Your answer was rejected: ${error.message} Grade the paper again. For every criterion, choose one of its allowed scores and give deductions that add up exactly to the gap between its maximum and that score.`,
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
      language: submission.feedbackLanguage ?? defaultFeedbackLanguage,
    };
  },
});

export const grade = internalAction({
  args: { submissionId: v.id("submissions"), startedAt: v.number() },
  handler: async (ctx, args) => {
    const input: GradingInput | null = await ctx.runQuery(
      internal.grading.getInput,
      args,
    );
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

export const regrade = mutation({
  args: {
    submissionId: v.id("submissions"),
    language: feedbackLanguageValidator,
  },
  handler: async (ctx, args) => {
    const submission = await requireOwned(
      ctx,
      "submissions",
      args.submissionId,
    );
    if (submission.transcription?.status !== "done") {
      throw new ConvexError(
        "The submission can only be graded once the transcription is done.",
      );
    }
    if (submission.grading?.status === "inProgress") {
      throw new ConvexError("The submission is already being graded.");
    }
    await startGrading(ctx, submission._id, args.language);
    return null;
  },
});
