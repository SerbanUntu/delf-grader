import { formatDate, formatNumber } from "./format";
import type { GradingResult } from "./grading";
import { type FeedbackLanguage, legacyFeedbackLanguage } from "./languages";
import { getLevelLabel, getMistakeCategory, getRubric } from "./rubrics";
import { maxTotalScore } from "./scores";

/**
 * The fixed text of the exported feedback in one language, with the colon written as that language writes it.
 */
export interface FeedbackLabels {
  colon: string;
  examDate: string;
  totalScore: string;
  anomalies: string;
  overview: string;
  criteria: string;
  deductions: string;
  noDeductions: string;
  automatic: string;
}

export const feedbackLabels: Record<FeedbackLanguage, FeedbackLabels> = {
  en: {
    colon: ": ",
    examDate: "Exam date",
    totalScore: "Total score",
    anomalies: "Anomalies found",
    overview: "Overall feedback",
    criteria: "Feedback by criterion",
    deductions: "Points removed",
    noDeductions: "No points removed.",
    automatic: "automatic",
  },
  ro: {
    colon: ": ",
    examDate: "Data examenului",
    totalScore: "Punctaj total",
    anomalies: "Anomalii semnalate",
    overview: "Apreciere generală",
    criteria: "Detalii pe criterii",
    deductions: "Puncte scăzute",
    noDeductions: "Nu s-au scăzut puncte.",
    automatic: "automat",
  },
  fr: {
    colon: " : ",
    examDate: "Date de l'examen",
    totalScore: "Note totale",
    anomalies: "Anomalies relevées",
    overview: "Appréciation générale",
    criteria: "Détail par critère",
    deductions: "Points retirés",
    noDeductions: "Aucun point retiré.",
    automatic: "automatique",
  },
};

export interface FeedbackDeduction {
  points: string;
  reason: string;
  categories: string[];
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
  labels: FeedbackLabels;
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
    labels: feedbackLabels[result.language ?? legacyFeedbackLanguage],
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
            categories: (deduction.categories ?? []).map(
              (categoryId) => getMistakeCategory(categoryId).frenchName,
            ),
            isAutomatic: deduction.isAutomatic,
          })),
        },
      ];
    }),
  };
}

/**
 * Writes the text of a deduction, such as "-1 (Conjugaison) : Le verbe n'est pas conjugué." or "-1 : Le texte compte 150 mots. (automatique)".
 *
 * @param deduction The deduction.
 * @param labels The fixed text in the language of the feedback.
 * @returns The text of the deduction.
 */
export function formatDeduction(
  deduction: FeedbackDeduction,
  labels: FeedbackLabels,
): string {
  const categories =
    deduction.categories.length > 0
      ? ` (${deduction.categories.join(", ")})`
      : "";
  const automatic = deduction.isAutomatic ? ` (${labels.automatic})` : "";
  return `${deduction.points}${categories}${labels.colon}${deduction.reason}${automatic}`;
}

/**
 * Writes the feedback as plain text to paste into a messaging app such as WhatsApp, where text between asterisks is shown in bold.
 *
 * @param feedback The feedback.
 * @returns The text.
 */
export function formatFeedbackText(feedback: Feedback): string {
  const { labels } = feedback;
  const sections = [
    [
      `*${feedback.title}*`,
      `${labels.examDate}${labels.colon}${feedback.examDate}`,
      `*${labels.totalScore}${labels.colon}${feedback.totalScore}*`,
    ],
  ];
  if (feedback.anomalies.length > 0) {
    sections.push([
      `*${labels.anomalies}*`,
      ...feedback.anomalies.map((anomaly) => `- ${anomaly}`),
    ]);
  }
  if (feedback.overview) {
    sections.push([`*${labels.overview}*`, feedback.overview]);
  }
  sections.push([`*${labels.criteria}*`]);
  for (const criterion of feedback.criteria) {
    sections.push([
      `*${criterion.name}${labels.colon}${criterion.score}*`,
      criterion.level,
      ...(criterion.overview ? [criterion.overview] : []),
      ...(criterion.deductions.length > 0
        ? [
            `${labels.deductions}${labels.colon.trimEnd()}`,
            ...criterion.deductions.map((deduction) =>
              formatDeduction(deduction, labels),
            ),
          ]
        : [labels.noDeductions]),
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
