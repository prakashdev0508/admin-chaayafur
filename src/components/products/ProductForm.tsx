import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
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
import { slugify } from "@/lib/product-utils";
import type { CategoryTreeItem } from "@/types/category";
import type { ProductFormValues } from "@/types/product";

export const emptyProductFormValues: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "",
  subCategoryId: "",
  isActive: true,
  productFeatures: [],
  images: [{ url: "", altText: "", sortOrder: 0 }],
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

  useEffect(() => {
    setValues(defaultValues);
    setCategoryId("");
  }, [defaultValues]);

  useEffect(() => {
    fetchCategoriesTree()
      .then(setCategoriesTree)
      .catch(() => setCategoriesTree([]));
  }, []);

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

  const addImage = () => {
    if (values.images.length < 10) {
      updateField("images", [
        ...values.images,
        { url: "", altText: "", sortOrder: values.images.length },
      ]);
    }
  };

  const updateImage = (
    index: number,
    field: "url" | "altText" | "sortOrder",
    value: string | number,
  ) => {
    const next = [...values.images];
    next[index] = { ...next[index], [field]: value };
    updateField("images", next);
  };

  const validate = () => {
    if (!values.name.trim()) return "Product name is required";
    if (!values.slug.trim()) return "Slug is required";
    if (!categoryId) return "Category is required";
    if (!values.subCategoryId) return "Sub-category is required";
    if (!values.price || parseFloat(values.price) < 0) return "Valid price is required";
    if (!values.stock || parseInt(values.stock, 10) < 0) return "Valid stock is required";
    if (values.images.filter((img) => img.url.trim()).length > 10) {
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

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>CDN image URLs (max 10)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {values.images.map((image, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3"
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label>Image URL</Label>
                  <Input
                    value={image.url}
                    onChange={(e) => updateImage(index, "url", e.target.value)}
                    placeholder="https://cdn.example.com/products/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={image.sortOrder}
                    onChange={(e) =>
                      updateImage(index, "sortOrder", Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-3">
                  <Label>Alt text</Label>
                  <Input
                    value={image.altText}
                    onChange={(e) =>
                      updateImage(index, "altText", e.target.value)
                    }
                    placeholder="Product front view"
                  />
                </div>
              </div>
            ))}
            {values.images.length < 10 && (
              <Button type="button" variant="outline" onClick={addImage}>
                <Plus className="size-4" />
                Add image
              </Button>
            )}
          </CardContent>
        </Card>
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
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (INR)</Label>
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

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting
            ? "Saving..."
            : submitLabel ?? (mode === "create" ? "Save product" : "Update product")}
        </Button>
      </div>
    </form>
  );
}
