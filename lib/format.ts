import { format } from "date-fns";

/**
 * Formats a date as `31/12/1999`.
 *
 * @param date A date or a timestamp in milliseconds.
 * @returns The formatted date.
 */
export function formatDate(date: Date | number): string {
  return format(date, "dd/MM/yyyy");
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
