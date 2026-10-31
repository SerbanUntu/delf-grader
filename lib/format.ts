import { format, isValid, parse } from "date-fns";

export const classNamePlaceholder = "Clasa a IX-a Z";
export const examDatePlaceholder = "31/12/1999";
export const defaultSubmissionName = "Practice Exam";
export const submissionNameHint = "Do not include student names";

export const maxNameLength = 100;
export const maxQuestionLength = 10000;

const isoDateFormat = "yyyy-MM-dd";

/**
 * Turns a date into an ISO date such as `1999-12-31`, the form in which dates without a time are stored, so they do not depend on time zones.
 *
 * @param date The date, read in the local time zone.
 * @returns The ISO date.
 */
export function toIsoDate(date: Date): string {
  return format(date, isoDateFormat);
}

/**
 * Turns an ISO date such as `1999-12-31` into a date at local midnight.
 *
 * @param isoDate The ISO date.
 * @returns The date, which is invalid if the value is not an ISO date.
 */
export function parseIsoDate(isoDate: string): Date {
  return parse(isoDate, isoDateFormat, new Date());
}

/**
 * Checks that a value is a real ISO date, such as `1999-12-31`.
 *
 * @param value The value to check.
 * @returns Whether the value is a valid ISO date.
 */
export function isIsoDate(value: string): boolean {
  const date = parseIsoDate(value);
  return isValid(date) && toIsoDate(date) === value;
}

/**
 * Formats a date as `31/12/1999`.
 *
 * @param date A date, a timestamp in milliseconds or an ISO date such as `1999-12-31`.
 * @returns The formatted date.
 */
export function formatDate(date: Date | number | string): string {
  return format(
    typeof date === "string" ? parseIsoDate(date) : date,
    "dd/MM/yyyy",
  );
}

/**
 * Formats a number with a decimal point and no trailing zeros, such as `17.5` or `17`.
 *
 * @param value The number to format.
 * @param maximumDecimals The largest number of digits kept after the decimal point.
 * @returns The formatted number.
 */
export function formatNumber(value: number, maximumDecimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maximumDecimals,
    useGrouping: false,
  }).format(value);
}

/**
 * Builds the name used for a session whose name was left empty, such as "Clasa a IX-a Z - 31/12/1999".
 *
 * @param className The name of the class, or an empty string if it is not known yet.
 * @param examDate The stored exam date, or undefined if it is not picked yet.
 * @returns The default session name.
 */
export function defaultSessionName(
  className: string,
  examDate: string | undefined,
): string {
  const classPart = className.trim() || classNamePlaceholder;
  const datePart = examDate ? formatDate(examDate) : examDatePlaceholder;
  return `${classPart} - ${datePart}`;
}
