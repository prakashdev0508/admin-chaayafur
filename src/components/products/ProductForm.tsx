import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
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
import { fetchCategoriesTree } from "@/services/categories.service";
import { listWoods } from "@/services/woods.service";
import { ProductImageUploader } from "@/components/products/ProductImageUploader";
import { queryKeys } from "@/lib/query-keys";
import { slugify } from "@/lib/product-utils";
import type { CategoryTreeItem } from "@/types/category";
import type { ProductFormValues, ProductWoodFormEntry } from "@/types/product";

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
  images: [],
};

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

  const assignedWoodIds = new Set(values.woods.map((w) => w.woodId));

  const toggleWoodAssignment = (woodId: number, assigned: boolean) => {
    if (assigned) {
      const next: ProductWoodFormEntry[] = [
        ...values.woods,
        { woodId, isActive: true },
      ];
      updateField("woods", next);
      return;
    }
    updateField(
      "woods",
      values.woods.filter((w) => w.woodId !== woodId),
    );
  };

  const setWoodActive = (woodId: number, isActive: boolean) => {
    updateField(
      "woods",
      values.woods.map((w) =>
        w.woodId === woodId ? { ...w, isActive } : w,
      ),
    );
  };

  const validate = () => {
    if (!values.name.trim()) return "Product name is required";
    if (!values.slug.trim()) return "Slug is required";
    if (!categoryId) return "Category is required";
    if (!values.subCategoryId) return "Sub-category is required";
    if (!values.price || parseFloat(values.price) < 0) return "Valid price is required";
    if (
      values.priceWithoutDiscount.trim() &&
      parseFloat(values.priceWithoutDiscount) < 0
    ) {
      return "Compare-at price must be ≥ 0";
    }
    if (!values.stock || parseInt(values.stock, 10) < 0) return "Valid stock is required";
    if (isImageUploading) return "Wait for image uploads to finish";
    if (values.images.length > 10) {
      return "Maximum 10 images allowed";
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
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
            <CardDescription>Basic information about the product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product name</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => updateField("name", e.target.value)}
                onBlur={handleNameBlur}
                placeholder="e.g. Warmly Lounge Chair"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField("slug", e.target.value);
                }}
                placeholder="e.g. warmly-lounge-chair"
              />
              <p className="text-xs text-muted-foreground">
                Unique URL identifier across all products
              </p>
            </div>
            <div className="space-y-2">
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
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
            <div className="space-y-2">
              <Label>Product features</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="e.g. 1-year warranty"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addFeature())
                  }
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {values.productFeatures.map((feature, index) => (
                  <span
                    key={`${feature}-${index}`}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                  >
                    {feature}
                    <button type="button" onClick={() => removeFeature(index)}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Max 50 features, 200 characters each
              </p>
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
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <Label htmlFor="active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Visible on storefront when active
              </p>
            </div>
            <Switch
              id="active"
              checked={values.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Merchandising</CardTitle>
            <CardDescription>
              CMS tags for storefront sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                {
                  key: "isFeaturedProduct" as const,
                  label: "Featured product",
                  description: "Show in Featured section",
                },
                {
                  key: "isBestSeller" as const,
                  label: "Best seller",
                  description: "Show in Best sellers section",
                },
                {
                  key: "isMostPopular" as const,
                  label: "Most popular",
                  description: "Show in Most popular section",
                },
                {
                  key: "isNewArrival" as const,
                  label: "New arrival",
                  description: "Show in New arrivals section",
                },
              ] as const
            ).map((tag) => (
              <div
                key={tag.key}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <Label htmlFor={tag.key}>{tag.label}</Label>
                  <p className="text-xs text-muted-foreground">
                    {tag.description}
                  </p>
                </div>
                <Switch
                  id={tag.key}
                  checked={values[tag.key]}
                  onCheckedChange={(checked) =>
                    updateField(tag.key, checked)
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling price (INR)</Label>
              <Input
                id="price"
                type="number"
                value={values.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceWithoutDiscount">Compare-at / MRP (INR)</Label>
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
              />
              <p className="text-xs text-muted-foreground">
                Display-only strikethrough price. Leave blank if unused.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Woods</CardTitle>
            <CardDescription>
              Assign wood options customers can choose at checkout
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {woodsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading woods…</p>
            )}
            {!woodsQuery.isLoading && catalogWoods.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No woods in the catalog yet. Create them under Woods.
              </p>
            )}
            {catalogWoods.map((wood) => {
              const assigned = assignedWoodIds.has(wood.id);
              const entry = values.woods.find((w) => w.woodId === wood.id);
              return (
                <div
                  key={wood.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={assigned}
                      onChange={(e) =>
                        toggleWoodAssignment(wood.id, e.target.checked)
                      }
                      className="size-4"
                    />
                    <span
                      className="size-3.5 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: wood.color }}
                      aria-hidden
                    />
                    <span className="truncate font-medium">{wood.name}</span>
                    {!wood.isActive && (
                      <span className="text-xs text-muted-foreground">
                        (catalog inactive)
                      </span>
                    )}
                  </label>
                  {assigned && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Active
                      </span>
                      <Switch
                        checked={entry?.isActive ?? true}
                        onCheckedChange={(checked) =>
                          setWoodActive(wood.id, checked)
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock quantity</Label>
              <Input
                id="stock"
                type="number"
                value={values.stock}
                onChange={(e) => updateField("stock", e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        {displayError && (
          <p className="text-sm text-destructive">{displayError}</p>
        )}

        <Button type="submit" disabled={isSubmitting || isImageUploading} className="w-full">
          {isSubmitting
            ? "Saving..."
            : submitLabel ?? (mode === "create" ? "Save product" : "Update product")}
        </Button>
      </div>
    </form>
  );
}
