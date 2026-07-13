export function formatCurrency(amount: string | number) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  });
}

export function formatPhone(phone: string) {
  if (phone.startsWith("+")) return phone;
  if (phone.length === 10) return `+91${phone}`;
  return phone;
}
