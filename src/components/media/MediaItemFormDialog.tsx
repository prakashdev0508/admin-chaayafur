import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadMediaImage } from "@/services/uploads.service";
import type {
  CreateMediaItemPayload,
  MediaImageInput,
  MediaItem,
  MediaItemVendor,
  UpdateMediaItemPayload,
} from "@/types/media";

type MediaItemFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: MediaItem | null;
  vendors: MediaItemVendor[];
  onSubmit: (
    payload: CreateMediaItemPayload | UpdateMediaItemPayload,
  ) => Promise<unknown>;
  loading?: boolean;
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function MediaItemFormDialog({
  open,
  onOpenChange,
  initial,
  vendors,
  onSubmit,
  loading,
}: MediaItemFormDialogProps) {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [showOnHome, setShowOnHome] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<MediaImageInput | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFieldKey, setImageFieldKey] = useState(0);

  const vendorItems = useMemo(() => {
    const options = [...vendors];
    if (
      initial &&
      !options.some((vendor) => vendor.id === initial.vendorId)
    ) {
      options.unshift(initial.vendor);
    }
    return options.map((vendor) => ({
      value: String(vendor.id),
      label: vendor.name,
    }));
  }, [vendors, initial]);

  useEffect(() => {
    if (!open) return;
    setVendorId(initial ? String(initial.vendorId) : null);
    setLink(initial?.link ?? "");
    setDescription(initial?.description ?? "");
    setSortOrder(String(initial?.sortOrder ?? 0));
    setShowOnHome(initial?.showOnHome ?? false);
    setIsActive(initial?.isActive ?? true);
    setOriginalImageUrl(initial?.coverImageUrl ?? null);
    setImage(
      initial?.coverImageUrl
        ? {
            url: initial.coverImageUrl,
            ...(initial.coverImageStorageKey
              ? { storageKey: initial.coverImageStorageKey }
              : {}),
          }
        : null,
    );
    setUploading(false);
    setImageFieldKey((key) => key + 1);
  }, [open, initial]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedLink = link.trim();
    const trimmedDescription = description.trim();
    const parsedVendorId = Number(vendorId);

    if (!Number.isInteger(parsedVendorId) || parsedVendorId <= 0) {
      toast.error("Choose a vendor");
      return;
    }
    if (!isHttpUrl(trimmedLink)) {
      toast.error("Enter a full http or https link");
      return;
    }
    if (!trimmedDescription || !image?.url) return;

    const imageChanged = image.url !== originalImageUrl;
    const payload: CreateMediaItemPayload | UpdateMediaItemPayload = {
      vendorId: parsedVendorId,
      link: trimmedLink,
      description: trimmedDescription,
      sortOrder: Number.parseInt(sortOrder, 10) || 0,
      showOnHome,
      isActive,
      coverImageUrl: image.url,
    };

    if (image.storageKey && (imageChanged || !initial)) {
      payload.coverImageStorageKey = image.storageKey;
    }

    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>
              {initial ? "Edit coverage" : "New coverage"}
            </DialogTitle>
            <DialogDescription>
              Story, feature, or mention linked to a press vendor.
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
                  <h3 className="text-sm font-medium">Vendor</h3>
                  <p className="text-xs text-muted-foreground">
                    Which publication this coverage belongs to.
                  </p>
                </div>
                <Select
                  value={vendorId}
                  onValueChange={(value) => {
                    if (!value) return;
                    setVendorId(value);
                  }}
                  items={vendorItems}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Story</h3>
                  <p className="text-xs text-muted-foreground">
                    Link and short description shown with the cover.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-item-link">Link *</Label>
                  <Input
                    id="media-item-link"
                    name="media-item-link"
                    type="url"
                    required
                    autoComplete="off"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    placeholder="https://example.com/articles/chaaya-feature"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-item-description">Description *</Label>
                  <Textarea
                    id="media-item-description"
                    name="media-item-description"
                    required
                    maxLength={2000}
                    rows={3}
                    autoComplete="off"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Chaaya featured in the summer living special"
                    disabled={loading}
                    className="resize-none"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">
                    Cover{!image?.url ? " *" : ""}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Hero image for the storefront. JPG, PNG, or WEBP — landscape
                    recommended.
                  </p>
                </div>
                <MediaImageField
                  key={imageFieldKey}
                  image={image}
                  onChange={setImage}
                  upload={uploadMediaImage}
                  required
                  disabled={loading}
                  hint=""
                  onUploadingChange={setUploading}
                />
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
                    htmlFor="media-item-active"
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  >
                    <span>
                      <span className="block text-sm font-medium">Active</span>
                      <span className="block text-xs text-muted-foreground">
                        Visible on storefront
                      </span>
                    </span>
                    <Switch
                      id="media-item-active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      disabled={loading}
                    />
                  </label>
                  <label
                    htmlFor="media-item-home"
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  >
                    <span>
                      <span className="block text-sm font-medium">
                        Show on home
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Homepage media strip
                      </span>
                    </span>
                    <Switch
                      id="media-item-home"
                      checked={showOnHome}
                      onCheckedChange={setShowOnHome}
                      disabled={loading}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-item-sort">Sort order</Label>
                  <Input
                    id="media-item-sort"
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
                disabled={
                  loading ||
                  uploading ||
                  !vendorId ||
                  !link.trim() ||
                  !description.trim() ||
                  !image?.url
                }
              >
                {loading
                  ? "Saving..."
                  : initial
                    ? "Save changes"
                    : "Create coverage"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
