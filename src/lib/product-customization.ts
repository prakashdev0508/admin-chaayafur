import { parseMoney } from "@/lib/customization-pricing";
import type {
  ProductCustomizationFormEntry,
  ProductCustomizationOption,
  ProductCustomizationPick,
} from "@/types/product";

export const MAX_PRODUCT_CUSTOMIZATION_OPTIONS = 50;

export type CustomizationGroup = {
  groupName: string;
  options: ProductCustomizationOption[];
};

export type CustomizationSelection = Record<string, string>;

export function isCustomizationOptionActive(
  option: Pick<ProductCustomizationOption, "isActive" | "isAvailable">,
) {
  if (option.isAvailable === false) return false;
  return option.isActive !== false;
}

export function normalizeCustomizationOptions(
  options: ProductCustomizationOption[] | null | undefined,
): ProductCustomizationOption[] {
  return (options ?? []).map((option) => ({
    groupName: option.groupName,
    value: option.value,
    price: parseMoney(option.price),
    image: option.image ?? "",
    isActive: isCustomizationOptionActive(option),
    isAvailable: isCustomizationOptionActive(option),
  }));
}

export function groupProductCustomization(
  options: ProductCustomizationOption[] | null | undefined,
  activeOnly = false,
): CustomizationGroup[] {
  const groups: CustomizationGroup[] = [];
  const indexByName = new Map<string, number>();

  for (const option of normalizeCustomizationOptions(options)) {
    if (activeOnly && !isCustomizationOptionActive(option)) continue;
    const name = option.groupName.trim();
    if (!name) continue;
    const existing = indexByName.get(name);
    if (existing == null) {
      indexByName.set(name, groups.length);
      groups.push({ groupName: name, options: [option] });
    } else {
      groups[existing].options.push(option);
    }
  }

  return groups;
}

export function customizationToForm(
  options: ProductCustomizationOption[] | null | undefined,
): ProductCustomizationFormEntry[] {
  return normalizeCustomizationOptions(options).map((option) => ({
    groupName: option.groupName,
    value: option.value,
    price: String(parseMoney(option.price)),
    image: typeof option.image === "string" ? option.image : "",
    isActive: isCustomizationOptionActive(option),
  }));
}

export function formCustomizationToPayload(
  entries: ProductCustomizationFormEntry[],
): ProductCustomizationOption[] {
  return entries
    .map((entry) => ({
      groupName: entry.groupName.trim(),
      value: entry.value.trim(),
      price: parseMoney(entry.price),
      image: entry.image.trim(),
      isActive: entry.isActive !== false,
    }))
    .filter((entry) => entry.groupName && entry.value);
}

export function validateProductCustomizationForm(
  entries: ProductCustomizationFormEntry[],
): string | null {
  const payload = formCustomizationToPayload(entries);
  if (payload.length > MAX_PRODUCT_CUSTOMIZATION_OPTIONS) {
    return `Maximum ${MAX_PRODUCT_CUSTOMIZATION_OPTIONS} customization options`;
  }

  const seen = new Set<string>();
  for (const option of payload) {
    if (!Number.isFinite(parseMoney(option.price))) {
      return "Customization prices must be valid numbers";
    }
    const key = `${option.groupName.toLowerCase()}::${option.value.toLowerCase()}`;
    if (seen.has(key)) {
      return `Duplicate option “${option.groupName} / ${option.value}”`;
    }
    seen.add(key);
  }

  for (const entry of entries) {
    const price = entry.price.trim();
    if (!price) continue;
    const n = parseFloat(price);
    if (!Number.isFinite(n)) {
      return "Customization prices must be valid numbers";
    }
  }

  return null;
}

export function maxCustomizationGroupPrices(
  options: ProductCustomizationOption[] | null | undefined,
): number {
  return groupProductCustomization(options, true).reduce((sum, group) => {
    const max = Math.max(0, ...group.options.map((o) => parseMoney(o.price)));
    return sum + max;
  }, 0);
}

export function maxCustomizationFormPrices(
  entries: ProductCustomizationFormEntry[],
): number {
  return maxCustomizationGroupPrices(formCustomizationToPayload(entries));
}

export function customizationPicksFromSelection(
  selection: CustomizationSelection,
): ProductCustomizationPick[] {
  return Object.entries(selection)
    .map(([groupName, value]) => ({
      groupName: groupName.trim(),
      value: value.trim(),
    }))
    .filter((pick) => pick.groupName && pick.value)
    .sort((a, b) => a.groupName.localeCompare(b.groupName));
}

export function buildCustomizationKey(
  picks: ProductCustomizationPick[] | null | undefined,
): string {
  const parts = (picks ?? [])
    .map((pick) => `${pick.groupName.trim()}:${pick.value.trim()}`)
    .filter((part) => part !== ":")
    .sort((a, b) => a.localeCompare(b));
  return parts.join("|");
}

export function resolveSelectedCustomization(
  options: ProductCustomizationOption[] | null | undefined,
  selection: CustomizationSelection,
): ProductCustomizationOption[] {
  const groups = groupProductCustomization(options, true);
  const selected: ProductCustomizationOption[] = [];
  for (const group of groups) {
    const value = selection[group.groupName];
    if (!value) continue;
    const match = group.options.find((option) => option.value === value);
    if (match) selected.push(match);
  }
  return selected;
}

export function snapshotToPicks(
  snapshots: Array<{ groupName: string; value: string }> | null | undefined,
): ProductCustomizationPick[] {
  return (snapshots ?? [])
    .map((option) => ({
      groupName: option.groupName.trim(),
      value: option.value.trim(),
    }))
    .filter((pick) => pick.groupName && pick.value);
}
