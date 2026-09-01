import {
  buildCustomizationKey,
  snapshotToPicks,
} from "@/lib/product-customization";
import { formatPriceAdjustment } from "@/lib/customization-pricing";
import type {
  ProductCustomizationOption,
  ProductCustomizationPick,
} from "@/types/product";

export type CartLineRef = {
  productId: number;
  woodId?: number | null;
  polishId?: number | null;
  fabricId?: number | null;
  customizationKey?: string | null;
};

export type CartItem = {
  productId: number;
  quantity: number;
  name: string;
  price: string;
  imageUrl?: string;
  slug?: string;
  stock?: number;
  isAvailable?: boolean;
  basePrice?: string | null;
  woodId?: number | null;
  woodName?: string | null;
  woodColor?: string | null;
  woodPriceAdjustment?: string | null;
  polishId?: number | null;
  polishName?: string | null;
  polishColor?: string | null;
  polishPriceAdjustment?: string | null;
  fabricId?: number | null;
  fabricName?: string | null;
  fabricColor?: string | null;
  fabricPriceAdjustment?: string | null;
  customization?: ProductCustomizationOption[];
  customizationKey?: string | null;
};

export type CartOrderItem = {
  productId: number;
  quantity: number;
  woodId?: number;
  polishId?: number;
  fabricId?: number;
  customization?: ProductCustomizationPick[];
};

/** Line from GET /cart (server-computed pricing). */
export type ServerCartLine = {
  productId: number;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  name: string;
  slug: string;
  stock: number;
  imageUrl: string | null;
  isAvailable: boolean;
  /** Current Product.price before customization adjustments. */
  basePrice?: string | null;
  woodId?: number | null;
  woodName?: string | null;
  woodColor?: string | null;
  woodPriceAdjustment?: string | null;
  polishId?: number | null;
  polishName?: string | null;
  polishColor?: string | null;
  polishPriceAdjustment?: string | null;
  fabricId?: number | null;
  fabricName?: string | null;
  fabricColor?: string | null;
  fabricPriceAdjustment?: string | null;
  customization?: ProductCustomizationOption[];
  customizationKey?: string | null;
};

export type CartResponse = {
  items: ServerCartLine[];
  itemCount: number;
  subtotalAmount: string;
};

function lineCustomizationKey(
  ref: Pick<CartLineRef, "customizationKey"> & {
    customization?: ProductCustomizationOption[] | ProductCustomizationPick[];
  },
): string {
  if (ref.customizationKey) return ref.customizationKey;
  return buildCustomizationKey(snapshotToPicks(ref.customization));
}

/** Stable key for a cart line (product + optional wood / polish / fabric / groups). */
export function cartLineKey(ref: CartLineRef & { customization?: ProductCustomizationOption[] }): string {
  const wood = ref.woodId ?? "none";
  const polish = ref.polishId ?? "none";
  const fabric = ref.fabricId ?? "none";
  const custom = lineCustomizationKey(ref) || "none";
  return `${ref.productId}:${wood}:${polish}:${fabric}:${custom}`;
}

export function cartLineRefFromItem(
  item: Pick<
    CartItem,
    | "productId"
    | "woodId"
    | "polishId"
    | "fabricId"
    | "customization"
    | "customizationKey"
  >,
): CartLineRef {
  const customizationKey = lineCustomizationKey(item);
  return {
    productId: item.productId,
    woodId: item.woodId ?? null,
    polishId: item.polishId ?? null,
    fabricId: item.fabricId ?? null,
    customizationKey: customizationKey || null,
  };
}

export function cartLineQueryParams(ref: CartLineRef): {
  woodId?: number;
  polishId?: number;
  fabricId?: number;
  customizationKey?: string;
} {
  const params: {
    woodId?: number;
    polishId?: number;
    fabricId?: number;
    customizationKey?: string;
  } = {};
  if (ref.woodId != null) params.woodId = ref.woodId;
  if (ref.polishId != null) params.polishId = ref.polishId;
  if (ref.fabricId != null) params.fabricId = ref.fabricId;
  if (ref.customizationKey) params.customizationKey = ref.customizationKey;
  return params;
}

export function upsertPayloadFromLine(
  line: Pick<
    CartItem,
    | "productId"
    | "quantity"
    | "woodId"
    | "polishId"
    | "fabricId"
    | "customization"
  >,
): UpsertCartItemPayload {
  const payload: UpsertCartItemPayload = {
    productId: line.productId,
    quantity: line.quantity,
  };
  if (line.woodId != null) payload.woodId = line.woodId;
  if (line.polishId != null) payload.polishId = line.polishId;
  if (line.fabricId != null) payload.fabricId = line.fabricId;
  const picks = snapshotToPicks(line.customization);
  if (picks.length > 0) payload.customization = picks;
  return payload;
}

export function serverCartLineToCartItem(line: ServerCartLine): CartItem {
  return {
    productId: line.productId,
    quantity: line.quantity,
    name: line.name,
    price: line.unitPrice,
    slug: line.slug,
    imageUrl: line.imageUrl ?? undefined,
    stock: line.stock,
    isAvailable: line.isAvailable,
    basePrice: line.basePrice ?? null,
    woodId: line.woodId ?? null,
    woodName: line.woodName ?? null,
    woodColor: line.woodColor ?? null,
    woodPriceAdjustment: line.woodPriceAdjustment ?? null,
    polishId: line.polishId ?? null,
    polishName: line.polishName ?? null,
    polishColor: line.polishColor ?? null,
    polishPriceAdjustment: line.polishPriceAdjustment ?? null,
    fabricId: line.fabricId ?? null,
    fabricName: line.fabricName ?? null,
    fabricColor: line.fabricColor ?? null,
    fabricPriceAdjustment: line.fabricPriceAdjustment ?? null,
    customization: line.customization ?? [],
    customizationKey:
      line.customizationKey ?? (lineCustomizationKey(line) || null),
  };
}

/** Slim row from GET /carts (staff) */
export type AdminCartListItem = {
  id: number;
  customerId: number;
  customerPhone: string;
  itemCount: number;
  lineCount: number;
  subtotalAmount: string;
  updatedAt: string;
  createdAt: string;
};

export type ListAdminCartsParams = {
  page?: number;
  limit?: number;
  customerId?: number;
  customerPhone?: string;
  hasItems?: boolean;
};

/** GET /carts/:cartId */
export type AdminCartDetail = {
  id: number;
  customerId: number;
  customer: { id: number; phone: string };
  items: ServerCartLine[];
  itemCount: number;
  subtotalAmount: string;
  createdAt: string;
  updatedAt: string;
};

export type SeedAdminCartPayload = {
  customerId: number;
  productId: number;
  quantity: number;
  woodId?: number;
  polishId?: number;
  fabricId?: number;
  customization?: ProductCustomizationPick[];
};

export type UpsertAdminCartItemPayload = {
  productId: number;
  quantity: number;
  woodId?: number;
  polishId?: number;
  fabricId?: number;
  customization?: ProductCustomizationPick[];
};

export type UpsertCartItemPayload = {
  productId: number;
  quantity: number;
  woodId?: number;
  polishId?: number;
  fabricId?: number;
  customization?: ProductCustomizationPick[];
};

export type CartMaterialChip = {
  label: string;
  name: string;
  color?: string | null;
  image?: string | null;
  /** Formatted adjustment label e.g. "+₹500", when > 0. */
  priceAdjustmentLabel?: string | null;
};

/** Display chips for wood / polish / fabric / option groups on a cart line. */
export function getCartLineMaterialChips(
  item: Pick<
    CartItem,
    | "woodName"
    | "woodColor"
    | "woodPriceAdjustment"
    | "polishName"
    | "polishColor"
    | "polishPriceAdjustment"
    | "fabricName"
    | "fabricColor"
    | "fabricPriceAdjustment"
    | "customization"
  >,
): CartMaterialChip[] {
  const chips: CartMaterialChip[] = [];
  if (item.woodName) {
    chips.push({
      label: "Wood",
      name: item.woodName,
      color: item.woodColor,
      priceAdjustmentLabel: formatPriceAdjustment(item.woodPriceAdjustment),
    });
  }
  if (item.polishName) {
    chips.push({
      label: "Polish",
      name: item.polishName,
      color: item.polishColor,
      priceAdjustmentLabel: formatPriceAdjustment(item.polishPriceAdjustment),
    });
  }
  if (item.fabricName) {
    chips.push({
      label: "Fabric",
      name: item.fabricName,
      color: item.fabricColor,
      priceAdjustmentLabel: formatPriceAdjustment(item.fabricPriceAdjustment),
    });
  }
  for (const option of item.customization ?? []) {
    chips.push({
      label: option.groupName,
      name: option.value,
      image: option.image || null,
      priceAdjustmentLabel: formatPriceAdjustment(option.price),
    });
  }
  return chips;
}
