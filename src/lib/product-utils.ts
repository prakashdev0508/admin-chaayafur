import type {
  CreateProductPayload,
  Product,
  ProductFormValues,
  ProductImageInput,
  ProductListItem,
  ProductMerchandisingTag,
} from "@/types/product";
import type { StatusVariant } from "@/lib/status-variants";
import {
  customizationToForm,
  formCustomizationToPayload,
} from "@/lib/product-customization";

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
    hsnCode: product.hsnCode ?? "",
    stock: String(product.stock),
    categoryId: String(
      product.subCategory?.categoryId ??
        product.subCategory?.category?.id ??
        "",
    ),
    subCategoryId: String(product.subCategoryId ?? product.subCategory?.id ?? ""),
    isActive: product.isActive,
    isBestSeller: product.isBestSeller ?? false,
    isFeaturedProduct: product.isFeaturedProduct ?? false,
    isMostPopular: product.isMostPopular ?? false,
    isNewArrival: product.isNewArrival ?? false,
    productFeatures: product.productFeatures,
    customization: customizationToForm(product.customization),
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
  const hsn = values.hsnCode.trim();

  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim() || undefined,
    price: parseFloat(values.price),
    priceWithoutDiscount: mrp ? parseFloat(mrp) : null,
    hsnCode: hsn || null,
    stock: parseInt(values.stock, 10),
    subCategoryId: parseInt(values.subCategoryId, 10),
    isActive: values.isActive,
    isBestSeller: values.isBestSeller,
    isFeaturedProduct: values.isFeaturedProduct,
    isMostPopular: values.isMostPopular,
    isNewArrival: values.isNewArrival,
    productFeatures: values.productFeatures,
    customization: formCustomizationToPayload(values.customization),
    woods: [],
    polishes: [],
    fabrics: [],
    images: images.length > 0 ? images : undefined,
  };
}
