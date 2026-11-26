import { type ReactNode, useId } from "react";
import type { FeedbackLanguage } from "@/lib/languages";

function UnitedKingdomFlag() {
  const id = `flag${useId().replace(/[^\w-]/g, "")}`;
  const outlineId = `${id}-outline`;
  const diagonalsId = `${id}-diagonals`;
  return (
    <>
      <clipPath id={outlineId}>
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id={diagonalsId}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath={`url(#${outlineId})`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath={`url(#${diagonalsId})`}
          stroke="#C8102E"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </>
  );
}

function TricolorFlag({ colors }: { colors: [string, string, string] }) {
  return (
    <>
      {colors.map((color, index) => (
        <rect key={color} x={index} width="1" height="2" fill={color} />
      ))}
    </>
  );
}

const flags: Record<
  FeedbackLanguage,
  { viewBox: string; content: () => ReactNode }
> = {
  en: { viewBox: "0 0 60 30", content: () => <UnitedKingdomFlag /> },
  fr: {
    viewBox: "0 0 3 2",
    content: () => <TricolorFlag colors={["#0055A4", "#FFFFFF", "#EF4135"]} />,
  },
  ro: {
    viewBox: "0 0 3 2",
    content: () => <TricolorFlag colors={["#002B7F", "#FCD116", "#CE1126"]} />,
  },
};

/**
 * The flag of a feedback language: the United Kingdom for English, Romania for Romanian and France for French.
 *
 * @param language The feedback language.
 */
export function LanguageFlag({ language }: { language: FeedbackLanguage }) {
  const flag = flags[language];
  return (
    <svg
      aria-hidden
      viewBox={flag.viewBox}
      preserveAspectRatio="xMidYMid slice"
      className="h-4 w-6 shrink-0 rounded-[2px] ring-1 ring-black/15"
    >
      {flag.content()}
    </svg>
  );
}
