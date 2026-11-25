import {
  ArrowBottomRightIcon,
  ArrowRightIcon,
  ArrowTopRightIcon,
} from "@radix-ui/react-icons";
import { formatNumber } from "@/lib/format";
import { getTrendDirection, type TrendDirection } from "@/lib/scores";
import { cn } from "@/lib/utils";

const directions: Record<
  TrendDirection,
  { icon: typeof ArrowRightIcon; className: string }
> = {
  up: { icon: ArrowTopRightIcon, className: "text-emerald-700" },
  down: { icon: ArrowBottomRightIcon, className: "text-red-700" },
  flat: { icon: ArrowRightIcon, className: "text-muted-foreground" },
};

/**
 * The change in points from the previous session, such as `+1.5`, with an arrow showing which way the score went.
 *
 * @param change The change in points.
 */
export function ScoreChange({ change }: { change: number }) {
  const { icon: Icon, className } = directions[getTrendDirection(change)];
  const text = `${change > 0 ? "+" : ""}${formatNumber(change)}`;

  return (
    <div
      role="img"
      aria-label={`Change from the previous session: ${text} points`}
      title="Change from the previous session"
      className={cn("flex items-center gap-1 font-semibold", className)}
    >
      <Icon aria-hidden className="size-5" />
      <span aria-hidden className="tabular-nums">
        {text}
      </span>
    </div>
  );
}
