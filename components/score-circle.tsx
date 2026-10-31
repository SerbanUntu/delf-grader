import { formatNumber } from "@/lib/format";
import { getScoreBand, maxTotalScore, type ScoreBand } from "@/lib/scores";
import { cn } from "@/lib/utils";

const bandColors: Record<ScoreBand, string> = {
  green: "stroke-emerald-600",
  yellow: "stroke-yellow-400",
  orange: "stroke-orange-500",
  red: "stroke-red-600",
};

const sizes = {
  sm: { circle: "size-10", stroke: 4, score: "text-base font-semibold" },
  lg: { circle: "size-24", stroke: 8, score: "text-3xl font-bold" },
};

/**
 * A progress circle that fills to the total score out of 25 and is colored by score, with the score next to it.
 *
 * @param score The total score, or null when there is no graded submission yet, which greys out the circle and shows "N/A".
 * @param size The size of the circle, "sm" for cards and "lg" for the grading screen.
 * @param className Extra classes for the wrapper.
 */
export function ScoreCircle({
  score,
  size = "sm",
  className,
}: {
  score: number | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { circle, stroke, score: scoreClassName } = sizes[size];
  const radius = 50 - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const filled =
    score === null
      ? 0
      : Math.min(Math.max(score / maxTotalScore, 0), 1) * circumference;
  const label =
    score === null
      ? "Score not available"
      : `Score: ${formatNumber(score)} out of ${maxTotalScore}`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("flex items-center gap-3", className)}
    >
      <svg viewBox="0 0 100 100" aria-hidden className={cn("shrink-0", circle)}>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        {score !== null && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            transform="rotate(-90 50 50)"
            className={cn(
              "transition-[stroke-dasharray] duration-700",
              bandColors[getScoreBand(score)],
            )}
          />
        )}
      </svg>
      <span
        aria-hidden
        className={cn(
          scoreClassName,
          "tabular-nums",
          score === null && "text-muted-foreground",
        )}
      >
        {score === null
          ? "N/A"
          : `${formatNumber(score)}/${formatNumber(maxTotalScore)}`}
      </span>
    </div>
  );
}
