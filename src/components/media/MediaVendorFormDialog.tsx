import { useEffect, useState } from "react";
import { MediaImageField } from "@/components/media/MediaImageField";
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
import { uploadMediaVendorImage } from "@/services/uploads.service";
import type {
  CreateMediaVendorPayload,
  MediaImageInput,
  MediaVendor,
  UpdateMediaVendorPayload,
} from "@/types/media";

type MediaVendorFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: MediaVendor | null;
  onSubmit: (
    payload: CreateMediaVendorPayload | UpdateMediaVendorPayload,
  ) => Promise<unknown>;
  loading?: boolean;
};

export function MediaVendorFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  loading,
}: MediaVendorFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<MediaImageInput | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFieldKey, setImageFieldKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setSortOrder(String(initial?.sortOrder ?? 0));
    setIsActive(initial?.isActive ?? true);
    setOriginalImageUrl(initial?.imageUrl ?? null);
    setImage(
      initial?.imageUrl
        ? {
            url: initial.imageUrl,
            ...(initial.imageStorageKey
              ? { storageKey: initial.imageStorageKey }
              : {}),
          }
        : null,
    );
    setUploading(false);
    setImageFieldKey((key) => key + 1);
  }, [open, initial]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !image?.url) return;

    const imageChanged = image.url !== originalImageUrl;
    const trimmedDescription = description.trim();
    const payload: CreateMediaVendorPayload | UpdateMediaVendorPayload = {
      name: trimmedName,
      sortOrder: Number.parseInt(sortOrder, 10) || 0,
      isActive,
      imageUrl: image.url,
    };

    if (initial) {
      payload.description = trimmedDescription || null;
    } else if (trimmedDescription) {
      payload.description = trimmedDescription;
    }

    if (image.storageKey && (imageChanged || !initial)) {
      payload.imageStorageKey = image.storageKey;
    }

    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>
              {initial ? "Edit vendor" : "New vendor"}
            </DialogTitle>
            <DialogDescription>
              Publication or outlet. Add coverage after this vendor exists.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => void handleSubmit(event)}
            autoComplete="off"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Details</h3>
                  <p className="text-xs text-muted-foreground">
                    Name and short description for this outlet.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-vendor-name">Name *</Label>
                  <Input
                    id="media-vendor-name"
                    name="media_vendor_outlet_name"
                    value={name}
                    maxLength={120}
                    required
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Architectural Digest"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-vendor-description">Description</Label>
                  <Textarea
                    id="media-vendor-description"
                    name="media_vendor_outlet_description"
                    value={description}
                    maxLength={2000}
                    rows={3}
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Featured press and editorial coverage"
                    disabled={loading}
                    className="resize-none"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">
                    Logo{!image?.url ? " *" : ""}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Publication mark for the storefront. JPG, PNG, or WEBP —
                    square works best.
                  </p>
                </div>
                <MediaImageField
                  key={imageFieldKey}
                  image={image}
                  onChange={setImage}
                  upload={uploadMediaVendorImage}
                  required
                  disabled={loading}
                  hint=""
                  aspectClassName="aspect-square"
                  previewFrameClassName="w-full max-w-[200px]"
                  onUploadingChange={setUploading}
                />
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Visibility</h3>
                  <p className="text-xs text-muted-foreground">
                    Control listing order and storefront visibility.
                  </p>
                </div>
                <label
                  htmlFor="media-vendor-active"
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3"
                >
                  <span>
                    <span className="block text-sm font-medium">Active</span>
                    <span className="block text-xs text-muted-foreground">
                      Hidden vendors stay off the storefront
                    </span>
                  </span>
                  <Switch
                    id="media-vendor-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={loading}
                  />
                </label>
                <div className="space-y-2">
                  <Label htmlFor="media-vendor-sort">Sort order</Label>
                  <Input
                    id="media-vendor-sort"
                    type="number"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                    disabled={loading}
                    className="max-w-[160px]"
                  />
                </div>
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
                disabled={loading || uploading || !name.trim() || !image?.url}
              >
                {loading
                  ? "Saving..."
                  : initial
                    ? "Save changes"
                    : "Create vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
