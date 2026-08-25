import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BannerImageUploader,
  type BannerImageInput,
} from "@/components/website/BannerImageUploader";
import type {
  AdminBanner,
  BannerType,
  CreateBannerPayload,
  UpdateBannerPayload,
} from "@/types/home";

const BANNER_TYPE_ITEMS = [
  { value: "MAIN", label: "Main (carousel)" },
  { value: "SUB", label: "Sub (sidebar card)" },
];

const IMAGE_PRESETS: Record<
  BannerType,
  {
    desktop: {
      aspectClassName: string;
      previewFrameClassName?: string;
      hint: string;
      dimensionLabel: string;
    };
    mobile: {
      aspectClassName: string;
      previewFrameClassName?: string;
      hint: string;
      dimensionLabel: string;
    };
  }
> = {
  MAIN: {
    desktop: {
      aspectClassName: "aspect-[16/9]",
      hint: "Wide hero for desktop and tablet carousel.",
      dimensionLabel: "16:9 · e.g. 1920 × 1080 px",
    },
    mobile: {
      aspectClassName: "aspect-[9/16]",
      previewFrameClassName: "mx-auto max-w-[220px]",
      hint: "Portrait crop for phones. Falls back to desktop when omitted.",
      dimensionLabel: "9:16 · e.g. 750 × 1334 px",
    },
  },
  SUB: {
    desktop: {
      aspectClassName: "aspect-[16/10]",
      hint: "Landscape image for the promo card thumbnail.",
      dimensionLabel: "16:10 · e.g. 800 × 500 px",
    },
    mobile: {
      aspectClassName: "aspect-[4/5]",
      previewFrameClassName: "mx-auto max-w-[240px]",
      hint: "Taller crop for small screens. Falls back to desktop when omitted.",
      dimensionLabel: "4:5 · e.g. 600 × 750 px",
    },
  },
};

type BannerFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AdminBanner | null;
  defaultType?: BannerType;
  onSubmit: (
    payload: CreateBannerPayload | UpdateBannerPayload,
  ) => Promise<unknown>;
  loading?: boolean;
};

export function BannerFormDialog({
  open,
  onOpenChange,
  initial,
  defaultType = "MAIN",
  onSubmit,
  loading,
}: BannerFormDialogProps) {
  const [type, setType] = useState<BannerType>(initial?.type ?? defaultType);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [redirectUrl, setRedirectUrl] = useState(initial?.redirectUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [image, setImage] = useState<BannerImageInput | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [mobileImage, setMobileImage] = useState<BannerImageInput | null>(null);
  const [originalMobileImageUrl, setOriginalMobileImageUrl] = useState<
    string | null
  >(null);

  const imagePresets = useMemo(() => IMAGE_PRESETS[type], [type]);

  useEffect(() => {
    if (!open) return;

    setType(initial?.type ?? defaultType);
    setTitle(initial?.title ?? "");
    setRedirectUrl(initial?.redirectUrl ?? "/shop/products");
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
    setOriginalMobileImageUrl(initial?.mobileImageUrl ?? null);
    setMobileImage(
      initial?.mobileImageUrl
        ? {
            url: initial.mobileImageUrl,
            ...(initial.mobileImageStorageKey
              ? { storageKey: initial.mobileImageStorageKey }
              : {}),
          }
        : null,
    );
  }, [open, initial, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image?.url) return;

    const imageChanged = image.url !== originalImageUrl;
    const mobileImageChanged = mobileImage?.url !== originalMobileImageUrl;
    const payload: CreateBannerPayload | UpdateBannerPayload = {
      type,
      title: title.trim() || null,
      redirectUrl: redirectUrl.trim(),
      sortOrder: Number.parseInt(sortOrder, 10) || 0,
      isActive,
      imageUrl: image.url,
    };

    if (image.storageKey && (imageChanged || !initial)) {
      payload.imageStorageKey = image.storageKey;
    }

    if (mobileImage?.url) {
      payload.mobileImageUrl = mobileImage.url;
      if (mobileImage.storageKey && (mobileImageChanged || !initial)) {
        payload.mobileImageStorageKey = mobileImage.storageKey;
      }
    } else if (initial?.mobileImageUrl) {
      payload.mobileImageUrl = null;
      payload.mobileImageStorageKey = null;
    }

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit banner" : "Add banner"}</DialogTitle>
          <DialogDescription>
            Main banners appear in the homepage carousel. Sub banners appear as
            promo cards beside it. Upload desktop and mobile images separately
            for the best fit on each screen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  if (!value) return;
                  setType(value as BannerType);
                }}
                items={BANNER_TYPE_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_TYPE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-title">Title</Label>
              <Input
                id="banner-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Urban Living Set"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-redirect">Redirect URL</Label>
            <Input
              id="banner-redirect"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="/shop/products?tag=isFeaturedProduct"
              required
            />
            <p className="text-xs text-muted-foreground">
              Prefer storefront paths like{" "}
              <code className="rounded bg-muted px-1">
                /shop/products?tag=isFeaturedProduct
              </code>
              , or a full https URL.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="banner-sort">Sort order</Label>
              <Input
                id="banner-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lower shows first (or use ← → on the page)
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 sm:mt-6">
              <div>
                <Label htmlFor="banner-active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Visible on storefront
                </p>
              </div>
              <Switch
                id="banner-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Banner images</p>
              <p className="text-xs text-muted-foreground">
                Side-by-side preview frames match how each image is shown on
                the storefront.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/10 p-4">
                <BannerImageUploader
                  image={image}
                  onChange={setImage}
                  disabled={loading}
                  required
                  label="Desktop image"
                  hint={imagePresets.desktop.hint}
                  dimensionLabel={imagePresets.desktop.dimensionLabel}
                  aspectClassName={imagePresets.desktop.aspectClassName}
                  previewFrameClassName={
                    imagePresets.desktop.previewFrameClassName
                  }
                />
              </div>

              <div className="rounded-xl border bg-muted/10 p-4">
                <BannerImageUploader
                  image={mobileImage}
                  previewUrl={initial?.mobileImageUrl}
                  onChange={setMobileImage}
                  disabled={loading}
                  label="Mobile image (optional)"
                  hint={imagePresets.mobile.hint}
                  dimensionLabel={imagePresets.mobile.dimensionLabel}
                  aspectClassName={imagePresets.mobile.aspectClassName}
                  previewFrameClassName={
                    imagePresets.mobile.previewFrameClassName
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !image?.url}>
              {loading ? "Saving..." : initial ? "Save changes" : "Create banner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
