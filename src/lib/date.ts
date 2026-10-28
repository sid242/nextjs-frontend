import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Extend dayjs with essential plugins
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Standard date & time format patterns across the platform.
 * Default pattern: "DD MMM YYYY hh:mm A" (e.g. "28 Oct 2026 12:04 PM").
 */
export const DATE_FORMATS = {
  /** "28 Oct 2026 12:04 PM" */
  DEFAULT: "DD MMM YYYY hh:mm A",
  /** "28 Oct 2026 12:04 PM" */
  DATE_TIME: "DD MMM YYYY hh:mm A",
  /** "28 Oct 2026" */
  DATE_ONLY: "DD MMM YYYY",
  /** "12:04 PM" */
  TIME_ONLY: "hh:mm A",
  /** "2026-10-28" */
  ISO_DATE: "YYYY-MM-DD",
  /** "28 Oct 2026 12:04:30 PM" */
  FULL_TIMESTAMP: "DD MMM YYYY hh:mm:ss A",
} as const;

export type DateFormatPattern = (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS] | string;
export type DateInput = string | number | Date | Dayjs | null | undefined;

/**
 * Safe conversion of any date input to a validated Dayjs instance.
 * Returns null if the value is null, undefined, empty, or an invalid date.
 */
export function toDayjs(input: DateInput): Dayjs | null {
  if (input == null || input === "") return null;
  const d = dayjs(input);
  return d.isValid() ? d : null;
}

/**
 * Checks whether the supplied input resolves to a valid date.
 */
export function isValidDate(input: DateInput): boolean {
  if (input == null || input === "") return false;
  return dayjs(input).isValid();
}

/**
 * Formats any date input into the platform default "DD MMM YYYY hh:mm A" format.
 * Returns fallback ("—") for null/undefined/invalid values.
 *
 * @example
 * formatDate("2026-10-28T12:04:00Z") // "28 Oct 2026 12:04 PM" (or local tz)
 * formatDate(new Date(), DATE_FORMATS.DATE_ONLY) // "28 Oct 2026"
 * formatDate(null) // "—"
 */
export function formatDate(
  input: DateInput,
  format: DateFormatPattern = DATE_FORMATS.DEFAULT,
  fallback = "—",
): string {
  const d = toDayjs(input);
  if (!d) return fallback;
  return d.format(format);
}

/**
 * Explicit helper to format date and time in "DD MMM YYYY hh:mm A".
 */
export function formatDateTime(
  input: DateInput,
  format: DateFormatPattern = DATE_FORMATS.DATE_TIME,
  fallback = "—",
): string {
  return formatDate(input, format, fallback);
}

/**
 * Formats date part only in "DD MMM YYYY" format (e.g. "28 Oct 2026").
 */
export function formatDateOnly(input: DateInput, fallback = "—"): string {
  return formatDate(input, DATE_FORMATS.DATE_ONLY, fallback);
}

/**
 * Formats time part only in "hh:mm A" format (e.g. "12:04 PM").
 */
export function formatTimeOnly(input: DateInput, fallback = "—"): string {
  return formatDate(input, DATE_FORMATS.TIME_ONLY, fallback);
}

/**
 * Formats relative duration from now (e.g. "2 hours ago", "in 3 days").
 */
export function formatRelativeTime(input: DateInput, fallback = "—"): string {
  const d = toDayjs(input);
  if (!d) return fallback;
  return d.fromNow();
}

/**
 * Returns difference in milliseconds (or other unit) between the input date and now.
 */
export function diffFromNow(
  input: DateInput,
  unit: dayjs.QUnitType | dayjs.OpUnitType = "milliseconds",
): number | null {
  const d = toDayjs(input);
  if (!d) return null;
  return d.diff(dayjs(), unit);
}

export { dayjs };
