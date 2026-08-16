export type ProductBulkColumnHelp = {
  column: string;
  required: boolean;
  hint: string;
};

export const PRODUCT_BULK_COLUMN_HELP: ProductBulkColumnHelp[] = [
  { column: "name", required: true, hint: "Product display name" },
  {
    column: "slug",
    required: true,
    hint: "Unique URL slug (must match staged image filenames)",
  },
  { column: "description", required: false, hint: "Optional text" },
  { column: "price", required: true, hint: "Selling price (number)" },
  {
    column: "priceWithoutDiscount",
    required: false,
    hint: "Compare-at / MRP",
  },
  { column: "stock", required: true, hint: "Integer ≥ 0" },
  {
    column: "subCategoryId",
    required: true,
    hint: "Integer ID or dropdown label: 12 - Living Room > Sofas",
  },
  {
    column: "isActive",
    required: false,
    hint: "true / false (dropdown; default true)",
  },
  {
    column: "isBestSeller",
    required: false,
    hint: "true / false",
  },
  {
    column: "isFeaturedProduct",
    required: false,
    hint: "true / false",
  },
  {
    column: "isMostPopular",
    required: false,
    hint: "true / false",
  },
  {
    column: "isNewArrival",
    required: false,
    hint: "true / false",
  },
  {
    column: "productFeatures",
    required: false,
    hint: "Pipe-separated, max 10: Feature A|Feature B",
  },
  {
    column: "images",
    required: false,
    hint: "Legacy: comma-separated CDN URLs, max 5 — overrides staged images when present",
  },
];

/** Backend-appended columns on the result workbook. */
export const PRODUCT_BULK_RESULT_COLUMNS: ProductBulkColumnHelp[] = [
  {
    column: "imagesAttached",
    required: false,
    hint: "Count of images attached for the row",
  },
  {
    column: "status",
    required: false,
    hint: 'Success, Success (no images found for slug "…"), or error message',
  },
];

