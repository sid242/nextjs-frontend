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

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
