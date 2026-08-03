import type {
  CreateProductPayload,
  Product,
  ProductFormValues,
  ProductImageInput,
  ProductListItem,
  ProductMerchandisingTag,
  ProductPolishFormEntry,
} from "@/types/product";
import type { StatusVariant } from "@/lib/status-variants";
import { parseMoney } from "@/lib/customization-pricing";

export function formatCurrency(amount: number | string) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getStockStatus(product: Pick<ProductListItem, "isActive" | "stock">) {
  if (!product.isActive) return "inactive" as const;
  if (product.stock === 0) return "out_of_stock" as const;
  if (product.stock <= 5) return "low_stock" as const;
  return "in_stock" as const;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export const productTagLabels: Record<ProductMerchandisingTag, string> = {
  isFeaturedProduct: "Featured",
  isBestSeller: "Best seller",
  isMostPopular: "Most popular",
  isNewArrival: "New arrival",
};

export const productTagVariants: Record<ProductMerchandisingTag, StatusVariant> = {
  isFeaturedProduct: "brand",
  isBestSeller: "warning",
  isMostPopular: "default",
  isNewArrival: "success",
};

export function getActiveProductTags(
  product: Pick<
    ProductListItem,
    "isBestSeller" | "isFeaturedProduct" | "isMostPopular" | "isNewArrival"
  >,
): ProductMerchandisingTag[] {
  const tags: ProductMerchandisingTag[] = [];
  if (product.isFeaturedProduct) tags.push("isFeaturedProduct");
  if (product.isBestSeller) tags.push("isBestSeller");
  if (product.isMostPopular) tags.push("isMostPopular");
  if (product.isNewArrival) tags.push("isNewArrival");
  return tags;
}

function adjustmentToForm(value: string | number | null | undefined): string {
  const n = parseMoney(value);
  return n === 0 ? "0" : String(n);
}

function polishEntriesFromProduct(product: Product): ProductPolishFormEntry[] {
  if (product.polishes && product.polishes.length > 0) {
    return product.polishes.map((p) => ({
      woodPolishId: p.id,
      isActive: p.isActive,
      priceAdjustment: adjustmentToForm(p.priceAdjustment),
    }));
  }

  const nested: ProductPolishFormEntry[] = [];
  for (const wood of product.woods ?? []) {
    for (const polish of wood.polishes ?? []) {
      nested.push({
        woodPolishId: polish.id,
        isActive: polish.isActive,
        priceAdjustment: adjustmentToForm(polish.priceAdjustment),
      });
    }
  }
  return nested;
}

export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: product.price,
    priceWithoutDiscount: product.priceWithoutDiscount ?? "",
    stock: String(product.stock),
    subCategoryId: String(product.subCategoryId),
    isActive: product.isActive,
    isBestSeller: product.isBestSeller ?? false,
    isFeaturedProduct: product.isFeaturedProduct ?? false,
    isMostPopular: product.isMostPopular ?? false,
    isNewArrival: product.isNewArrival ?? false,
    productFeatures: product.productFeatures,
    woods: (product.woods ?? []).map((w) => ({
      woodId: w.id,
      isActive: w.isActive,
      priceAdjustment: adjustmentToForm(w.priceAdjustment),
    })),
    polishes: polishEntriesFromProduct(product),
    fabrics: (product.fabrics ?? []).map((f) => ({
      fabricId: f.id,
      isActive: f.isActive,
      priceAdjustment: adjustmentToForm(f.priceAdjustment),
    })),
    images:
      product.images.length > 0
        ? product.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder,
            ...(img.storageKey ? { storageKey: img.storageKey } : {}),
          }))
        : [],
  };
}

function formAdjustmentToNumber(value: string): number {
  const n = parseFloat(value.trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function requireStringField(
  value: unknown,
  fieldLabel: string,
  options: { allowEmpty?: boolean } = {},
): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldLabel} is invalid. Please re-enter it and try again.`);
  }

  const trimmed = value.trim();
  if (!options.allowEmpty && !trimmed) {
    throw new Error(`${fieldLabel} is required.`);
  }

  return trimmed;
}

export function formValuesToCreatePayload(
  values: ProductFormValues,
): CreateProductPayload {
  const images = values.images
    .map((img, index) => {
      const imageUrl = requireStringField(
        img.url,
        `Image ${index + 1} URL`,
        { allowEmpty: true },
      );
      if (!imageUrl) return null;

      const payload: ProductImageInput = {
        url: imageUrl,
        altText: requireStringField(
          img.altText,
          `Image ${index + 1} alt text`,
          { allowEmpty: true },
        ),
        sortOrder: img.sortOrder ?? index,
      };
      if (img.storageKey) {
        payload.storageKey = img.storageKey;
      }
      return payload;
    })
    .filter((img): img is ProductImageInput => img !== null);

  const mrp = values.priceWithoutDiscount.trim();

  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim() || undefined,
    price: parseFloat(values.price),
    priceWithoutDiscount: mrp ? parseFloat(mrp) : null,
    stock: parseInt(values.stock, 10),
    subCategoryId: parseInt(values.subCategoryId, 10),
    isActive: values.isActive,
    isBestSeller: values.isBestSeller,
    isFeaturedProduct: values.isFeaturedProduct,
    isMostPopular: values.isMostPopular,
    isNewArrival: values.isNewArrival,
    productFeatures: values.productFeatures,
    woods: values.woods.map((w) => ({
      woodId: w.woodId,
      isActive: w.isActive,
      priceAdjustment: formAdjustmentToNumber(w.priceAdjustment),
    })),
    /** Always send polishes with woods so backend sync does not wipe custom prices. */
    polishes:
      values.woods.length === 0
        ? []
        : values.polishes.map((p) => ({
            woodPolishId: p.woodPolishId,
            isActive: p.isActive,
            priceAdjustment: formAdjustmentToNumber(p.priceAdjustment),
          })),
    fabrics: values.fabrics.map((f) => ({
      fabricId: f.fabricId,
      isActive: f.isActive,
      priceAdjustment: formAdjustmentToNumber(f.priceAdjustment),
    })),
    images: images.length > 0 ? images : undefined,
  };
}
