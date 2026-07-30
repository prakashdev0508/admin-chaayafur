import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, Package, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fetchCategoriesTree } from "@/services/categories.service";
import { listFabrics } from "@/services/fabrics.service";
import { listWoods } from "@/services/woods.service";
import { ProductImageUploader } from "@/components/products/ProductImageUploader";
import { ProductCustomizationEditor } from "@/components/products/ProductCustomizationEditor";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency } from "@/lib/format";
import { parseMoney } from "@/lib/customization-pricing";
import { slugify } from "@/lib/product-utils";
import { cn } from "@/lib/utils";
import type { CategoryTreeItem } from "@/types/category";
import type { ProductFormValues } from "@/types/product";

export const emptyProductFormValues: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  priceWithoutDiscount: "",
  stock: "",
  subCategoryId: "",
  isActive: true,
  isBestSeller: false,
  isFeaturedProduct: false,
  isMostPopular: false,
  isNewArrival: false,
  productFeatures: [],
  woods: [],
  polishes: [],
  fabrics: [],
  images: [],
};

const MERCH_TAGS = [
  { key: "isFeaturedProduct" as const, label: "Featured" },
  { key: "isBestSeller" as const, label: "Best seller" },
  { key: "isMostPopular" as const, label: "Most popular" },
  { key: "isNewArrival" as const, label: "New arrival" },
];

type ProductFormProps = {
  mode: "create" | "edit";
  defaultValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  submitLabel?: string;
};

export function ProductForm({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting,
  error,
  submitLabel,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(defaultValues);
  const [categoryId, setCategoryId] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [categoriesTree, setCategoriesTree] = useState<CategoryTreeItem[]>([]);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  useEffect(() => {
    setValues(defaultValues);
    setCategoryId("");
  }, [defaultValues]);

  useEffect(() => {
    fetchCategoriesTree()
      .then(setCategoriesTree)
      .catch(() => setCategoriesTree([]));
  }, []);

  const woodsQuery = useQuery({
    queryKey: queryKeys.woods.list({ limit: 100 }),
    queryFn: () => listWoods({ limit: 100 }),
  });
  const catalogWoods = woodsQuery.data?.items ?? [];

  const fabricsQuery = useQuery({
    queryKey: queryKeys.fabrics.list({ limit: 100 }),
    queryFn: () => listFabrics({ limit: 100 }),
  });
  const catalogFabrics = fabricsQuery.data?.items ?? [];

  useEffect(() => {
    if (!values.subCategoryId || categoriesTree.length === 0) return;

    for (const category of categoriesTree) {
      const match = category.subCategories.find(
        (sub) => String(sub.id) === values.subCategoryId,
      );
      if (match) {
        setCategoryId(String(category.id));
        return;
      }
    }
  }, [values.subCategoryId, categoriesTree]);

  const selectedCategory = categoriesTree.find(
    (category) => String(category.id) === categoryId,
  );
  const subCategories = selectedCategory?.subCategories ?? [];

  const categoryItems = useMemo(
    () =>
      categoriesTree.map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    [categoriesTree],
  );

  const subCategoryItems = useMemo(
    () =>
      subCategories.map((sub) => ({
        label: sub.name,
        value: String(sub.id),
      })),
    [subCategories],
  );

  const updateField = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameBlur = () => {
    if (!slugTouched && values.name.trim()) {
      updateField("slug", slugify(values.name));
    }
  };

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && values.productFeatures.length < 50) {
      updateField("productFeatures", [...values.productFeatures, trimmed]);
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    updateField(
      "productFeatures",
      values.productFeatures.filter((_, i) => i !== index),
    );
  };

  const basePrice = parseMoney(values.price);
  const maxWoodAdj = Math.max(
    0,
    ...values.woods
      .filter((w) => w.isActive)
      .map((w) => parseMoney(w.priceAdjustment)),
  );
  const maxPolishAdj = Math.max(
    0,
    ...values.polishes
      .filter((p) => p.isActive)
      .map((p) => parseMoney(p.priceAdjustment)),
  );
  const maxFabricAdj = Math.max(
    0,
    ...values.fabrics
      .filter((f) => f.isActive)
      .map((f) => parseMoney(f.priceAdjustment)),
  );
  const maxUnitPrice = basePrice + maxWoodAdj + maxPolishAdj + maxFabricAdj;
  const hasCustomizationPremium = maxUnitPrice > basePrice;

  const activeMerchCount = MERCH_TAGS.filter((t) => values[t.key]).length;

  const validate = () => {
    if (!values.name.trim()) return "Product name is required";
    if (!values.slug.trim()) return "Slug is required";
    if (!categoryId) return "Category is required";
    if (!values.subCategoryId) return "Sub-category is required";
    if (!values.price || parseFloat(values.price) < 0)
      return "Valid price is required";
    if (
      values.priceWithoutDiscount.trim() &&
      parseFloat(values.priceWithoutDiscount) < 0
    ) {
      return "Compare-at price must be ≥ 0";
    }
    if (!values.stock || parseInt(values.stock, 10) < 0)
      return "Valid stock is required";
    if (isImageUploading) return "Wait for image uploads to finish";
    if (values.images.length > 10) {
      return "Maximum 10 images allowed";
    }
    for (const wood of values.woods) {
      const adj = parseFloat(wood.priceAdjustment);
      if (wood.priceAdjustment.trim() && (!Number.isFinite(adj) || adj < 0)) {
        return "Wood price adjustments must be ≥ 0";
      }
    }
    for (const polish of values.polishes) {
      const adj = parseFloat(polish.priceAdjustment);
      if (polish.priceAdjustment.trim() && (!Number.isFinite(adj) || adj < 0)) {
        return "Polish price adjustments must be ≥ 0";
      }
    }
    for (const fabric of values.fabrics) {
      const adj = parseFloat(fabric.priceAdjustment);
      if (fabric.priceAdjustment.trim() && (!Number.isFinite(adj) || adj < 0)) {
        return "Fabric price adjustments must be ≥ 0";
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    await onSubmit(values);
  };

  const displayError = validationError ?? error;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]"
    >
      <div className="min-w-0 space-y-5">
        <Card className="overflow-hidden shadow-xs">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Package className="size-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Product details</CardTitle>
                <CardDescription>
                  Name, category, and storefront copy
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Product name</Label>
                <Input
                  id="name"
                  value={values.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="e.g. Warmly Lounge Chair"
                  className="h-10"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={values.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    updateField("slug", e.target.value);
                  }}
                  placeholder="e.g. warmly-lounge-chair"
                  className="h-10 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Unique URL identifier across all products
                </p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={values.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe materials, craftsmanship, and key features..."
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={categoryId || null}
                  onValueChange={(value) => {
                    if (!value) return;
                    setCategoryId(value);
                    updateField("subCategoryId", "");
                  }}
                  items={categoryItems}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesTree.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub-category</Label>
                <Select
                  value={values.subCategoryId || null}
                  onValueChange={(value) => {
                    if (value) updateField("subCategoryId", value);
                  }}
                  disabled={!categoryId}
                  items={subCategoryItems}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue
                      placeholder={
                        categoryId
                          ? "Select sub-category"
                          : "Select a category first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories.map((sub) => (
                      <SelectItem key={sub.id} value={String(sub.id)}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Product features</Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {values.productFeatures.length}/50
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="e.g. 1-year warranty"
                  className="h-10"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addFeature())
                  }
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  Add
                </Button>
              </div>
              {values.productFeatures.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {values.productFeatures.map((feature, index) => (
                    <span
                      key={`${feature}-${index}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                        aria-label={`Remove ${feature}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <ProductImageUploader
          key={`${mode}-${defaultValues.slug}-${defaultValues.images.map((img) => img.url).join(",")}`}
          images={values.images}
          onChange={(images) => updateField("images", images)}
          productName={values.name}
          disabled={isSubmitting}
          onUploadingChange={setIsImageUploading}
        />

        <Card className="overflow-hidden shadow-xs">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Layers className="size-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Customization & pricing</CardTitle>
                <CardDescription>
                  Assign woods, polishes, and fabrics with per-product
                  adjustments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <ProductCustomizationEditor
              catalogWoods={catalogWoods}
              catalogFabrics={catalogFabrics}
              woodsLoading={woodsQuery.isLoading}
              fabricsLoading={fabricsQuery.isLoading}
              woods={values.woods}
              polishes={values.polishes}
              fabrics={values.fabrics}
              onWoodsChange={(woods) => updateField("woods", woods)}
              onPolishesChange={(polishes) => updateField("polishes", polishes)}
              onFabricsChange={(fabrics) => updateField("fabrics", fabrics)}
            />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card className="overflow-hidden shadow-xs">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-base">Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Storefront</p>
                <p className="text-xs text-muted-foreground">
                  {values.isActive ? "Visible when saved" : "Hidden from shop"}
                </p>
              </div>
              <Switch
                id="active"
                checked={values.isActive}
                onCheckedChange={(checked) => updateField("isActive", checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Selling ₹</Label>
                <Input
                  id="price"
                  type="number"
                  value={values.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="h-9 tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={values.stock}
                  onChange={(e) => updateField("stock", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-9 tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priceWithoutDiscount">Compare-at / MRP</Label>
              <Input
                id="priceWithoutDiscount"
                type="number"
                value={values.priceWithoutDiscount}
                onChange={(e) =>
                  updateField("priceWithoutDiscount", e.target.value)
                }
                placeholder="Optional"
                min="0"
                step="0.01"
                className="h-9 tabular-nums"
              />
            </div>

            {basePrice > 0 && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Base</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(basePrice)}
                  </span>
                </div>
                {hasCustomizationPremium && (
                  <div className="mt-1.5 flex items-center justify-between gap-2 border-t pt-1.5">
                    <span className="text-muted-foreground">
                      Up to (with options)
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(maxUnitPrice)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-xs">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag className="size-3.5 text-muted-foreground" />
                <CardTitle className="text-base">Merchandising</CardTitle>
              </div>
              {activeMerchCount > 0 && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {activeMerchCount} on
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {MERCH_TAGS.map((tag) => {
                const on = values[tag.key];
                return (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => updateField(tag.key, !on)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.97]",
                      on
                        ? "border-foreground/15 bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                    )}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-xs">
          <CardContent className="space-y-2 pt-4 text-xs text-muted-foreground">
            <SummaryRow
              label="Images"
              value={String(values.images.length)}
            />
            <SummaryRow
              label="Woods"
              value={String(values.woods.length)}
            />
            <SummaryRow
              label="Polishes"
              value={String(values.polishes.length)}
            />
            <SummaryRow
              label="Fabrics"
              value={String(values.fabrics.length)}
            />
            <SummaryRow
              label="Features"
              value={String(values.productFeatures.length)}
            />
          </CardContent>
        </Card>

        {displayError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {displayError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || isImageUploading}
          className="h-11 w-full text-sm font-medium"
        >
          {isSubmitting
            ? "Saving..."
            : submitLabel ??
              (mode === "create" ? "Save product" : "Update product")}
        </Button>
      </aside>
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}
