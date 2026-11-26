import { formatDate, formatNumber } from "./format";
import type { GradingResult } from "./grading";
import { getLevelLabel, getRubric } from "./rubrics";
import { maxTotalScore } from "./scores";

export const feedbackLabels = {
  examDate: "Date de l'examen",
  totalScore: "Note totale",
  anomalies: "Anomalies relevées",
  overview: "Appréciation générale",
  criteria: "Détail par critère",
  deductions: "Points retirés",
  noDeductions: "Aucun point retiré.",
  automatic: "automatique",
} as const;

export interface FeedbackDeduction {
  points: string;
  reason: string;
  isAutomatic: boolean;
}

export interface FeedbackCriterion {
  name: string;
  score: string;
  level: string;
  overview?: string;
  deductions: FeedbackDeduction[];
}

/**
 * The feedback on a graded submission as it is shown to the student, with its numbers already formatted.
 */
export interface Feedback {
  title: string;
  examDate: string;
  totalScore: string;
  anomalies: string[];
  overview?: string;
  criteria: FeedbackCriterion[];
}

/**
 * Builds the feedback given to a student from the grading of their submission.
 *
 * @param result The grading result.
 * @param submissionName The name of the submission, used as the title.
 * @param examDate The stored exam date, such as `1999-12-31`.
 * @returns The feedback.
 */
export function buildFeedback({
  result,
  submissionName,
  examDate,
}: {
  result: GradingResult;
  submissionName: string;
  examDate: string;
}): Feedback {
  const rubric = getRubric(result.rubricId);
  return {
    title: submissionName,
    examDate: formatDate(examDate),
    totalScore: `${formatNumber(result.totalScore)}/${maxTotalScore}`,
    anomalies: rubric.anomalies
      .filter((anomaly) =>
        result.anomalies.some((anomalyId) => anomalyId === anomaly.id),
      )
      .map((anomaly) => anomaly.frenchName),
    overview: result.overview,
    criteria: result.criteria.flatMap((criterionResult) => {
      const criterion = rubric.criteria.find(
        (candidate) => candidate.id === criterionResult.criterionId,
      );
      if (!criterion) {
        return [];
      }
      return [
        {
          name: criterion.frenchName,
          score: `${formatNumber(criterionResult.score)}/${formatNumber(criterion.maxScore)}`,
          level: getLevelLabel(criterion, criterionResult.score),
          overview: criterionResult.overview,
          deductions: criterionResult.deductions.map((deduction) => ({
            points: `-${formatNumber(deduction.points)}`,
            reason: deduction.reason,
            isAutomatic: deduction.isAutomatic,
          })),
        },
      ];
    }),
  };
}

/**
 * Writes the text of a deduction, such as "-1 : The verb is not conjugated (automatique)".
 *
 * @param deduction The deduction.
 * @returns The text of the deduction.
 */
export function formatDeduction(deduction: FeedbackDeduction): string {
  const automatic = deduction.isAutomatic
    ? ` (${feedbackLabels.automatic})`
    : "";
  return `${deduction.points} : ${deduction.reason}${automatic}`;
}

/**
 * Writes the feedback as plain text to paste into a messaging app such as WhatsApp, where text between asterisks is shown in bold.
 *
 * @param feedback The feedback.
 * @returns The text.
 */
export function formatFeedbackText(feedback: Feedback): string {
  const sections = [
    [
      `*${feedback.title}*`,
      `${feedbackLabels.examDate} : ${feedback.examDate}`,
      `*${feedbackLabels.totalScore} : ${feedback.totalScore}*`,
    ],
  ];
  if (feedback.anomalies.length > 0) {
    sections.push([
      `*${feedbackLabels.anomalies}*`,
      ...feedback.anomalies.map((anomaly) => `- ${anomaly}`),
    ]);
  }
  if (feedback.overview) {
    sections.push([`*${feedbackLabels.overview}*`, feedback.overview]);
  }
  sections.push([`*${feedbackLabels.criteria}*`]);
  for (const criterion of feedback.criteria) {
    sections.push([
      `*${criterion.name} : ${criterion.score}*`,
      criterion.level,
      ...(criterion.overview ? [criterion.overview] : []),
      ...(criterion.deductions.length > 0
        ? [
            `${feedbackLabels.deductions} :`,
            ...criterion.deductions.map(formatDeduction),
          ]
        : [feedbackLabels.noDeductions]),
    ]);
  }
  return sections.map((lines) => lines.join("\n")).join("\n\n");
}

const forbiddenFileNameCharacters = '<>:"/\\|?*';

/**
 * Builds the name of the feedback PDF, such as "Practice Exam - Alex - 31-12-1999.pdf", without characters that are not allowed in file names.
 *
 * @param submissionName The name of the submission.
 * @param studentName The student name, or undefined if it is not known in this browser.
 * @param examDate The stored exam date, such as `1999-12-31`.
 * @returns The file name.
 */
export function getFeedbackFileName({
  submissionName,
  studentName,
  examDate,
}: {
  submissionName: string;
  studentName: string | undefined;
  examDate: string;
}): string {
  const name = [
    submissionName,
    studentName,
    formatDate(examDate).replaceAll("/", "-"),
  ]
    .filter(Boolean)
    .join(" - ");
  const cleanName = Array.from(name)
    .filter(
      (character) =>
        character >= " " && !forbiddenFileNameCharacters.includes(character),
    )
    .join("")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/, "")
    .trim();
  return `${cleanName || "Feedback"}.pdf`;
}
