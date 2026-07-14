import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryImageUploader } from "@/components/categories/CategoryImageUploader";
import { slugify } from "@/lib/product-utils";
import type {
  Category,
  CategoryImageInput,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/types/category";

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Category;
  onSubmit: (payload: CreateCategoryPayload | UpdateCategoryPayload) => Promise<unknown>;
  loading?: boolean;
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  loading,
}: CategoryFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isSignatureCollection, setIsSignatureCollection] = useState(
    initial?.isSignatureCollection ?? false,
  );
  const [image, setImage] = useState<CategoryImageInput | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSlug(initial?.slug ?? "");
      setDescription(initial?.description ?? "");
      setIsActive(initial?.isActive ?? true);
      setIsSignatureCollection(initial?.isSignatureCollection ?? false);
      setImage(
        initial?.imageUrl
          ? { url: initial.imageUrl }
          : null,
      );
      setSlugTouched(false);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!slugTouched && !initial) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateCategoryPayload | UpdateCategoryPayload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      isActive,
      isSignatureCollection,
      ...(image?.url
        ? {
            image: {
              url: image.url,
              ...(image.storageKey ? { storageKey: image.storageKey } : {}),
            },
          }
        : {}),
    };
    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit category" : "Add category"}
          </DialogTitle>
          <DialogDescription>
            Top-level groups like Bedroom, Living, or Dining.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bedroom"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="bedroom"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bedroom furniture"
              rows={3}
            />
          </div>

          <CategoryImageUploader
            image={image}
            previewUrl={initial?.imageUrl}
            onChange={setImage}
            disabled={loading}
          />

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="cat-signature">Signature collection</Label>
              <p className="text-xs text-muted-foreground">
                Feature this category as a signature collection on the storefront.
              </p>
            </div>
            <Switch
              id="cat-signature"
              checked={isSignatureCollection}
              onCheckedChange={setIsSignatureCollection}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="cat-active">Active on storefront</Label>
              <p className="text-xs text-muted-foreground">
                Inactive categories are hidden from the public catalogue tree.
              </p>
            </div>
            <Switch
              id="cat-active"
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
