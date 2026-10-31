import type { ReactNode } from "react";

/**
 * The heading of a step's screen, with a short explanation under it.
 *
 * @param title The name of the step.
 * @param children The explanation.
 */
export function StepHeading({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children && (
        <p className="mt-1 max-w-3xl text-muted-foreground">{children}</p>
      )}
    </div>
  );
}
