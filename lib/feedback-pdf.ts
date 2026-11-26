import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import {
  type Feedback,
  type FeedbackLabels,
  formatDeduction,
} from "./feedback";

type PdfMake = typeof import("pdfmake/build/pdfmake");

const accentColor = "#C9A227";
const mutedColor = "#555555";
const pageWidth = 595.28;
const pageMargin = 56;

function heading(text: string): Content {
  return { text, style: "heading", headlineLevel: 1 };
}

function criterionContent(
  criterion: Feedback["criteria"][number],
  labels: FeedbackLabels,
): Content {
  return {
    margin: [0, 12, 0, 0],
    stack: [
      {
        unbreakable: true,
        stack: [
          {
            columns: [
              { text: criterion.name, style: "criterion" },
              {
                text: criterion.score,
                style: "criterion",
                width: "auto",
                alignment: "right",
              },
            ],
            columnGap: 12,
          },
          { text: criterion.level, color: mutedColor, margin: [0, 2, 0, 0] },
          ...(criterion.overview
            ? [{ text: criterion.overview, margin: [0, 6, 0, 0] } as Content]
            : []),
        ],
      },
      criterion.deductions.length > 0
        ? {
            unbreakable: true,
            margin: [0, 6, 0, 0],
            stack: [
              {
                text: `${labels.deductions}${labels.colon.trimEnd()}`,
                bold: true,
              },
              {
                ul: criterion.deductions.map((deduction) =>
                  formatDeduction(deduction, labels),
                ),
                margin: [0, 2, 0, 0],
              },
            ],
          }
        : {
            text: labels.noDeductions,
            color: mutedColor,
            margin: [0, 6, 0, 0],
          },
    ],
  };
}

function buildDocument(feedback: Feedback): TDocumentDefinitions {
  const { labels } = feedback;
  return {
    pageSize: "A4",
    pageMargins: pageMargin,
    info: { title: feedback.title },
    pageBreakBefore: (node, nodes) =>
      node.headlineLevel === 1 &&
      nodes.getFollowingNodesOnPage().length === 0 &&
      nodes.getNodesOnNextPage().length > 0,
    defaultStyle: { fontSize: 11, lineHeight: 1.3 },
    styles: {
      title: { fontSize: 20, bold: true },
      heading: { fontSize: 14, bold: true, margin: [0, 20, 0, 4] },
      criterion: { fontSize: 12, bold: true },
    },
    content: [
      { text: feedback.title, style: "title" },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: pageWidth - 2 * pageMargin,
            y2: 0,
            lineWidth: 2,
            lineColor: accentColor,
          },
        ],
        margin: [0, 6, 0, 10],
      },
      {
        text: [
          { text: `${labels.examDate}${labels.colon}`, color: mutedColor },
          feedback.examDate,
        ],
      },
      {
        text: `${labels.totalScore}${labels.colon}${feedback.totalScore}`,
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 0],
      },
      ...(feedback.anomalies.length > 0
        ? [heading(labels.anomalies), { ul: feedback.anomalies } as Content]
        : []),
      ...(feedback.overview
        ? [heading(labels.overview), feedback.overview]
        : []),
      heading(labels.criteria),
      ...feedback.criteria.map((criterion) =>
        criterionContent(criterion, labels),
      ),
    ],
  };
}

/**
 * Makes a PDF of the feedback in the browser and downloads it.
 *
 * @param feedback The feedback.
 * @param fileName The name of the downloaded file.
 */
export async function downloadFeedbackPdf(
  feedback: Feedback,
  fileName: string,
) {
  const [pdfMakeModule, fontsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const pdfMake = (pdfMakeModule as unknown as { default: PdfMake }).default;
  pdfMake.addVirtualFileSystem(fontsModule.default);
  await pdfMake.createPdf(buildDocument(feedback)).download(fileName);
}
