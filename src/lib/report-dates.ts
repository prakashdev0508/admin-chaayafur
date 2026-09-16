/** ISO date (YYYY-MM-DD) in local calendar for report filter defaults. */
export function toReportDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Calendar date YYYY-MM-DD in Asia/Kolkata (IST). */
export function toIstDateString(date: Date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Format an ISO timestamp / date-only string as a calendar day in IST.
 * Prefer this for date-only fields stored as UTC midnight.
 */
export function formatIstDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    ...options,
  });
}

export function getDefaultReportDateRange(days = 30) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return {
    createdFrom: toReportDateString(from),
    createdTo: toReportDateString(to),
  };
}
