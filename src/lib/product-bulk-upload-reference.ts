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
  {
    column: "woods",
    required: false,
    hint: "Comma-separated: id or id:priceAdjustment — e.g. 1,2 or 1:3000,2:6000",
  },
  {
    column: "polishes",
    required: false,
    hint: "Same format; each polish must belong to an assigned wood",
  },
  {
    column: "fabrics",
    required: false,
    hint: "Comma-separated: id or id:priceAdjustment — e.g. 3,4 or 3:500",
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

export const PRODUCT_BULK_PRICING_NOTES = [
  "Format: optionId:priceAdjustment per entry, comma-separated.",
  "Omit :price to default priceAdjustment to 0 (backward compatible).",
  "Prices are product-specific — the same wood ID can have different prices on different rows.",
  'If woods is set and polishes is empty/omitted, active polishes of those woods are synced automatically at price 0.',
] as const;
