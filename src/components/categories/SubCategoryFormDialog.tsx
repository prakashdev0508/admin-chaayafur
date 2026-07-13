import { useEffect, useMemo, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/product-utils";
import type {
  CategoryTreeItem,
  CreateSubCategoryPayload,
  SubCategoryTreeItem,
  UpdateSubCategoryPayload,
} from "@/types/category";

type SubCategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryTreeItem[];
  initial?: SubCategoryTreeItem;
  defaultCategoryId?: number;
  onSubmit: (
    payload: CreateSubCategoryPayload | UpdateSubCategoryPayload,
  ) => Promise<unknown>;
  loading?: boolean;
};

export function SubCategoryFormDialog({
  open,
  onOpenChange,
  categories,
  initial,
  defaultCategoryId,
  onSubmit,
  loading,
}: SubCategoryFormDialogProps) {
  const [categoryId, setCategoryId] = useState(
    String(initial?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? ""),
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [heading, setHeading] = useState(initial?.heading ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setCategoryId(
        String(initial?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? ""),
      );
      setName(initial?.name ?? "");
      setSlug(initial?.slug ?? "");
      setHeading(initial?.heading ?? "");
      setDescription(initial?.description ?? "");
      setIsActive(initial?.isActive ?? true);
      setSlugTouched(false);
    }
  }, [open, initial, defaultCategoryId, categories]);

  useEffect(() => {
    if (!slugTouched && !initial) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched, initial]);

  const categoryItems = useMemo(
    () =>
      categories.map((cat) => ({
        label: cat.name,
        value: String(cat.id),
      })),
    [categories],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      name: name.trim(),
      slug: slug.trim(),
      heading: heading.trim() || undefined,
      description: description.trim() || undefined,
      isActive,
    };

    if (initial) {
      await onSubmit(base);
    } else {
      await onSubmit({
        ...base,
        categoryId: Number(categoryId),
      } as CreateSubCategoryPayload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit sub-category" : "Add sub-category"}
          </DialogTitle>
          <DialogDescription>
            Assignable product categories linked to a parent category.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initial && (
            <div className="space-y-2">
              <Label>Parent category</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => v && setCategoryId(v)}
                items={categoryItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="sub-name">Name</Label>
            <Input
              id="sub-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Beds"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-slug">Slug</Label>
            <Input
              id="sub-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="beds"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-heading">Heading</Label>
            <Input
              id="sub-heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Navigation column group"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-desc">Description</Label>
            <Textarea
              id="sub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="sub-active">Active on storefront</Label>
              <p className="text-xs text-muted-foreground">
                Inactive sub-categories are hidden from the public catalogue tree.
              </p>
            </div>
            <Switch
              id="sub-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initial ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
