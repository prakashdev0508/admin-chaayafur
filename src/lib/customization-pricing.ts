/** Parse API money strings / numbers; invalid → 0. */
export function parseMoney(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatPriceAdjustment(
  value: string | number | null | undefined,
): string | null {
  const n = parseMoney(value);
  if (n <= 0) return null;
  return `+${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n)}`;
}

type OptionWithAdjustment = {
  priceAdjustment?: string | number | null;
} | null | undefined;

/**
 * unitPrice = base + wood adj + polish adj + fabric adj + selected customization prices
 * Missing options contribute 0.
 */
export function computeCustomizationUnitPrice(
  basePrice: string | number,
  options?: {
    wood?: OptionWithAdjustment;
    polish?: OptionWithAdjustment;
    fabric?: OptionWithAdjustment;
    customization?: Array<{ price?: string | number | null } | null | undefined>;
  },
): number {
  const customizationTotal = (options?.customization ?? []).reduce(
    (sum, option) => sum + parseMoney(option?.price),
    0,
  );
  return (
    parseMoney(basePrice) +
    parseMoney(options?.wood?.priceAdjustment) +
    parseMoney(options?.polish?.priceAdjustment) +
    parseMoney(options?.fabric?.priceAdjustment) +
    customizationTotal
  );
}

/** Format a computed unit price as a decimal string for cart storage. */
export function formatUnitPriceAmount(amount: number): string {
  return amount.toFixed(2);
}
