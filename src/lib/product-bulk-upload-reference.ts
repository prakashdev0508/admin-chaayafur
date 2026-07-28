export type ProductBulkColumnHelp = {
  column: string;
  required: boolean;
  hint: string;
};

export const PRODUCT_BULK_COLUMN_HELP: ProductBulkColumnHelp[] = [
  { column: "name", required: true, hint: "Product display name" },
  { column: "slug", required: true, hint: "Unique URL slug" },
  { column: "price", required: true, hint: "Selling price (number)" },
  { column: "stock", required: true, hint: "Integer ≥ 0" },
  {
    column: "subCategoryId",
    required: true,
    hint: "Sub-category ID (see reference below)",
  },
  { column: "description", required: false, hint: "Optional text" },
  {
    column: "priceWithoutDiscount",
    required: false,
    hint: "Compare-at / MRP",
  },
  {
    column: "productFeatures",
    required: false,
    hint: "Pipe-separated, max 10: Feature A|Feature B",
  },
  {
    column: "images",
    required: false,
    hint: "Comma-separated CDN URLs, max 5 per product",
  },
  {
    column: "woods",
    required: false,
    hint: "Comma-separated wood IDs: 1,2",
  },
  {
    column: "fabrics",
    required: false,
    hint: "Comma-separated fabric IDs: 3,4",
  },
  {
    column: "isActive / CMS tags",
    required: false,
    hint: "true / false (isBestSeller, isFeaturedProduct, …)",
  },
];
