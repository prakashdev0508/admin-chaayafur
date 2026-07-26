import type {
  CreateProductPayload,
  Product,
  ProductFormValues,
  ProductImageInput,
  ProductListItem,
  ProductMerchandisingTag,
} from "@/types/product";
import type { StatusVariant } from "@/lib/status-variants";

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
    })),
    fabrics: (product.fabrics ?? []).map((f) => ({
      fabricId: f.id,
      isActive: f.isActive,
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

export function formValuesToCreatePayload(
  values: ProductFormValues,
): CreateProductPayload {
  const images = values.images
    .filter((img) => img.url.trim())
    .map((img, index) => {
      const payload: ProductImageInput = {
        url: img.url.trim(),
        altText: img.altText.trim(),
        sortOrder: img.sortOrder ?? index,
      };
      if (img.storageKey) {
        payload.storageKey = img.storageKey;
      }
      return payload;
    });

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
    })),
    fabrics: values.fabrics.map((f) => ({
      fabricId: f.fabricId,
      isActive: f.isActive,
    })),
    images: images.length > 0 ? images : undefined,
  };
}
