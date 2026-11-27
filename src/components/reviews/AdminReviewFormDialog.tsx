import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminReviewImageUploader } from "@/components/reviews/AdminReviewImageUploader";
import { StarRating } from "@/components/reviews/StarRating";
import { ProductSearchSelect } from "@/components/shared/ProductSearchSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminReview,
  AdminReviewImageInput,
  CreateAdminReviewPayload,
  UpdateAdminReviewPayload,
} from "@/types/admin-review";
import type { ProductListItem } from "@/types/product";

type AdminReviewFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AdminReview | null;
  onSubmit: (
    payload: CreateAdminReviewPayload | UpdateAdminReviewPayload,
  ) => Promise<unknown>;
  loading?: boolean;
};

function toProductListItem(
  review: AdminReview | null | undefined,
): ProductListItem | null {
  if (!review?.product) return null;
  return {
    id: review.product.id,
    name: review.product.name,
    slug: review.product.slug,
    price: "0",
    stock: 0,
    isActive: true,
    isBestSeller: false,
    isFeaturedProduct: false,
    isMostPopular: false,
    isNewArrival: false,
    isRecommended: false,
    productFeatures: [],
    categoryIds: [],
    categories: [],
    subCategoryIds: [],
    subCategories: [],
    primaryImage: null,
    createdAt: review.createdAt,
  };
}

function toImageInputs(review: AdminReview | null | undefined) {
  return (review?.images ?? []).map((image, index) => ({
    url: image.url,
    ...(image.storageKey ? { storageKey: image.storageKey } : {}),
    altText: image.altText ?? null,
    sortOrder: image.sortOrder ?? index,
  }));
}

function serializeImages(images: AdminReviewImageInput[]) {
  return JSON.stringify(
    images.map((image, index) => ({
      url: image.url,
      storageKey: image.storageKey ?? null,
      altText: image.altText ?? null,
      sortOrder: image.sortOrder ?? index,
    })),
  );
}

export function AdminReviewFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  loading,
}: AdminReviewFormDialogProps) {
  const [product, setProduct] = useState<ProductListItem | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [showOnHome, setShowOnHome] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<AdminReviewImageInput[]>([]);
  const [originalImagesJson, setOriginalImagesJson] = useState("[]");
  const [uploading, setUploading] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setProduct(toProductListItem(initial));
    setDisplayName(initial?.displayName ?? "");
    setLocation(initial?.location ?? "");
    setRating(initial?.rating ?? 5);
    setComment(initial?.comment ?? "");
    setSortOrder(initial ? String(initial.sortOrder) : "");
    setShowOnHome(initial?.showOnHome ?? false);
    setIsActive(initial?.isActive ?? true);
    const nextImages = toImageInputs(initial);
    setImages(nextImages);
    setOriginalImagesJson(serializeImages(nextImages));
    setUploading(false);
    setUploaderKey((key) => key + 1);
  }, [open, initial]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = displayName.trim();
    const trimmedLocation = location.trim();
    const trimmedComment = comment.trim();

    if (!product) {
      toast.error("Choose a product");
      return;
    }
    if (!trimmedName) {
      toast.error("Display name is required");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    const imagesChanged = serializeImages(images) !== originalImagesJson;
    const parsedSort = sortOrder.trim()
      ? Number.parseInt(sortOrder, 10)
      : undefined;

    if (initial) {
      const payload: UpdateAdminReviewPayload = {
        productId: product.id,
        displayName: trimmedName,
        location: trimmedLocation || null,
        rating,
        comment: trimmedComment || null,
        showOnHome,
        isActive,
      };
      if (parsedSort !== undefined && !Number.isNaN(parsedSort)) {
        payload.sortOrder = parsedSort;
      }
      if (imagesChanged) {
        payload.images = images.map((image, index) => ({
          url: image.url,
          ...(image.storageKey ? { storageKey: image.storageKey } : {}),
          altText: image.altText ?? null,
          sortOrder: image.sortOrder ?? index,
        }));
      }
      await onSubmit(payload);
      onOpenChange(false);
      return;
    }

    const payload: CreateAdminReviewPayload = {
      productId: product.id,
      displayName: trimmedName,
      rating,
      showOnHome,
      isActive,
      ...(trimmedLocation ? { location: trimmedLocation } : {}),
      ...(trimmedComment ? { comment: trimmedComment } : {}),
      ...(parsedSort !== undefined && !Number.isNaN(parsedSort)
        ? { sortOrder: parsedSort }
        : {}),
      ...(images.length > 0
        ? {
            images: images.map((image, index) => ({
              url: image.url,
              ...(image.storageKey ? { storageKey: image.storageKey } : {}),
              altText: image.altText ?? null,
              sortOrder: image.sortOrder ?? index,
            })),
          }
        : {}),
    };

    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>
              {initial ? "Edit review" : "New review"}
            </DialogTitle>
            <DialogDescription>
              Persona, rating, and optional photos for one product.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Product</h3>
                  <p className="text-xs text-muted-foreground">
                    This review appears on the selected product.
                  </p>
                </div>
                <ProductSearchSelect
                  value={product}
                  onChange={setProduct}
                  disabled={loading}
                  label=""
                />
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Persona</h3>
                  <p className="text-xs text-muted-foreground">
                    Name and place shown with the testimonial.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin-review-display-name">
                      Display name *
                    </Label>
                    <Input
                      id="admin-review-display-name"
                      required
                      maxLength={120}
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Anita Sharma"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-review-location">Location</Label>
                    <Input
                      id="admin-review-location"
                      maxLength={100}
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Mumbai"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rating *</Label>
                  <StarRating
                    value={rating}
                    interactive
                    onChange={setRating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-review-comment">Comment</Label>
                  <Textarea
                    id="admin-review-comment"
                    maxLength={2000}
                    rows={4}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Beautiful craftsmanship and finish."
                    disabled={loading}
                    className="resize-none"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Visibility</h3>
                  <p className="text-xs text-muted-foreground">
                    Control storefront and homepage placement.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    htmlFor="admin-review-active"
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  >
                    <span>
                      <span className="block text-sm font-medium">Active</span>
                      <span className="block text-xs text-muted-foreground">
                        Visible on storefront
                      </span>
                    </span>
                    <Switch
                      id="admin-review-active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      disabled={loading}
                    />
                  </label>
                  <label
                    htmlFor="admin-review-home"
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  >
                    <span>
                      <span className="block text-sm font-medium">
                        Show on home
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Featured reviews strip
                      </span>
                    </span>
                    <Switch
                      id="admin-review-home"
                      checked={showOnHome}
                      onCheckedChange={setShowOnHome}
                      disabled={loading}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-review-sort">Sort order</Label>
                  <Input
                    id="admin-review-sort"
                    type="number"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                    placeholder={
                      initial ? undefined : "Auto-assigned if empty"
                    }
                    disabled={loading}
                    className="max-w-[160px]"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium">Photos</h3>
                  <p className="text-xs text-muted-foreground">
                    Optional. Up to 10 images.
                  </p>
                </div>
                <AdminReviewImageUploader
                  key={uploaderKey}
                  images={images}
                  onChange={setImages}
                  disabled={loading}
                  onUploadingChange={setUploading}
                  compact
                />
              </section>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <DialogClose
                render={<Button type="button" variant="outline" />}
                disabled={loading}
              >
                Cancel
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  loading ||
                  uploading ||
                  !product ||
                  !displayName.trim() ||
                  rating < 1
                }
              >
                {loading
                  ? "Saving..."
                  : initial
                    ? "Save changes"
                    : "Create review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
