const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes === 0) return "0 B";
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** i;
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${UNITS[i]}`;
}

export {
  DATE_FORMATS,
  diffFromNow,
  formatDate,
  formatDateOnly,
  formatDateTime,
  formatRelativeTime,
  formatTimeOnly,
  isValidDate,
  toDayjs,
  type DateFormatPattern,
  type DateInput,
} from "./date";

export interface FormatMinorCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
}

/**
 * Formats an integer minor-unit monetary amount (e.g., paise or cents)
 * using the matching ISO-4217 currency symbol and locale grouping.
 */
export function formatMinorCurrency(
  amountMinor: number | null | undefined,
  currency = "USD",
  options?: FormatMinorCurrencyOptions,
): string {
  const safeMinor =
    typeof amountMinor === "number" && Number.isFinite(amountMinor) ? amountMinor : 0;
  const normalizedCurrency = (currency || "USD").trim().toUpperCase() || "USD";
  const locale = options?.locale ?? (normalizedCurrency === "INR" ? "en-IN" : "en-US");
  const hasFraction = Math.abs(safeMinor % 100) !== 0;
  const minimumFractionDigits = options?.minimumFractionDigits ?? (hasFraction ? 2 : 0);
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? Math.max(minimumFractionDigits, hasFraction ? 2 : 0);
  const major = safeMinor / 100;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(major);
  } catch {
    return `${normalizedCurrency} ${major.toFixed(maximumFractionDigits)}`;
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
