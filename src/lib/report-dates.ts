/** ISO date (YYYY-MM-DD) in local calendar for report filter defaults. */
export function toReportDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
