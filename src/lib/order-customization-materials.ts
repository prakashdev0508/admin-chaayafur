import type {
  OrderCustomizationRequest,
  OrderItem,
} from "@/types/order";
import {
  materialChip,
  type MaterialChip,
} from "@/components/customization-requests/CustomizationMaterialsHighlight";

type CatalogJoin = {
  name: string;
  color?: string | null;
} | null | undefined;

function fromSnapshots(item: OrderItem): MaterialChip[] {
  const chips: MaterialChip[] = [];
  if (item.woodName) {
    chips.push(materialChip("Wood", item.woodName, item.woodColor));
  }
  if (item.polishName) {
    chips.push(materialChip("Polish", item.polishName, item.polishColor));
  }
  if (item.fabricName) {
    chips.push(materialChip("Fabric", item.fabricName, item.fabricColor));
  }
  return chips;
}

function fromJoin(
  label: string,
  join: CatalogJoin,
): MaterialChip | null {
  if (!join?.name) return null;
  return materialChip(label, join.name, join.color);
}

function fromCustomizationRequest(
  request: OrderCustomizationRequest,
): MaterialChip[] {
  const chips: MaterialChip[] = [];
  const wood = fromJoin("Wood", request.wood);
  const polish = fromJoin("Polish", request.polish);
  const fabric = fromJoin("Fabric", request.fabric);
  if (wood) chips.push(wood);
  if (polish) chips.push(polish);
  if (fabric) chips.push(fabric);
  return chips;
}

/** Line-item materials with fallback to order `customizationRequest` for polish/fabric. */
export function getOrderItemMaterialChips(
  item: OrderItem,
  customizationRequest?: OrderCustomizationRequest | null,
): MaterialChip[] {
  const fromItem = fromSnapshots(item);
  const hasPolish = fromItem.some((c) => c.label === "Polish");
  const hasFabric = fromItem.some((c) => c.label === "Fabric");
  const hasWood = fromItem.some((c) => c.label === "Wood");

  if (!customizationRequest) {
    return fromItem;
  }

  const fallback = fromCustomizationRequest(customizationRequest);
  const merged = [...fromItem];

  if (!hasWood) {
    const wood = fallback.find((c) => c.label === "Wood");
    if (wood) merged.push(wood);
  }
  if (!hasPolish) {
    const polish = fallback.find((c) => c.label === "Polish");
    if (polish) merged.push(polish);
  }
  if (!hasFabric) {
    const fabric = fallback.find((c) => c.label === "Fabric");
    if (fabric) merged.push(fabric);
  }

  return merged;
}

export function getCustomizationRequestMaterialChips(
  request: {
    wood?: { name: string; color?: string } | null;
    polish?: { name: string; color?: string } | null;
    fabric?: { name: string; color?: string } | null;
  },
): MaterialChip[] {
  const chips: MaterialChip[] = [];
  if (request.wood) {
    chips.push(materialChip("Wood", request.wood.name, request.wood.color));
  }
  if (request.polish) {
    chips.push(materialChip("Polish", request.polish.name, request.polish.color));
  }
  if (request.fabric) {
    chips.push(materialChip("Fabric", request.fabric.name, request.fabric.color));
  }
  return chips;
}

export function orderShowsSeparateBilling(order: {
  addressId: number;
  billingAddressId: number | null;
  shippingAddress: string;
  billingAddress: string;
}): boolean {
  if (order.billingAddressId == null) return false;
  if (order.billingAddressId === order.addressId) return false;
  return order.billingAddress.trim() !== order.shippingAddress.trim();
}
