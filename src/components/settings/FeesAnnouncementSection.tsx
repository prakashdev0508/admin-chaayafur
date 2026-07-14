import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { queryKeys } from "@/lib/query-keys";
import { updateAdminSiteSettings } from "@/services/site-settings.service";
import type { AdminSiteSettings } from "@/types/site-settings";

type FeesAnnouncementSectionProps = {
  settings: AdminSiteSettings;
  canUpdate: boolean;
};

export function FeesAnnouncementSection({
  settings,
  canUpdate,
}: FeesAnnouncementSectionProps) {
  const queryClient = useQueryClient();
  const [flatShippingFee, setFlatShippingFee] = useState(
    settings.flatShippingFee ?? "",
  );
  const [freeShippingMinAmount, setFreeShippingMinAmount] = useState(
    settings.freeShippingMinAmount ?? "",
  );
  const [clearFreeShipping, setClearFreeShipping] = useState(
    settings.freeShippingMinAmount == null,
  );
  const [announcementText, setAnnouncementText] = useState(
    settings.announcementText ?? "",
  );
  const [announcementLinkUrl, setAnnouncementLinkUrl] = useState(
    settings.announcementLinkUrl ?? "",
  );
  const [announcementIsActive, setAnnouncementIsActive] = useState(
    settings.announcementIsActive,
  );

  useEffect(() => {
    setFlatShippingFee(settings.flatShippingFee ?? "");
    setFreeShippingMinAmount(settings.freeShippingMinAmount ?? "");
    setClearFreeShipping(settings.freeShippingMinAmount == null);
    setAnnouncementText(settings.announcementText ?? "");
    setAnnouncementLinkUrl(settings.announcementLinkUrl ?? "");
    setAnnouncementIsActive(settings.announcementIsActive);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: updateAdminSiteSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.siteSettings,
      });
      toast.success("Fees & announcement saved");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    },
  });

  function handleSave() {
    const fee = Number(flatShippingFee);
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("Enter a valid flat shipping fee");
      return;
    }

    let freeMin: number | null = null;
    if (!clearFreeShipping) {
      const parsed = Number(freeShippingMinAmount);
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error("Enter a valid free-shipping threshold, or clear it");
        return;
      }
      freeMin = parsed;
    }

    saveMutation.mutate({
      flatShippingFee: fee,
      freeShippingMinAmount: freeMin,
      announcementText: announcementText.trim() || null,
      announcementLinkUrl: announcementLinkUrl.trim() || null,
      announcementIsActive,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fees & announcement</CardTitle>
        <CardDescription>
          Flat shipping fee and free-shipping threshold apply at checkout.
          Pincode allowlists are managed separately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="flat-shipping-fee">Flat shipping fee (INR)</Label>
            <Input
              id="flat-shipping-fee"
              type="number"
              min={0}
              step="1"
              value={flatShippingFee}
              onChange={(e) => setFlatShippingFee(e.target.value)}
              disabled={!canUpdate}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="free-shipping-min">
                Free shipping above (INR)
              </Label>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="clear-free-shipping"
                  className="text-xs font-normal text-muted-foreground"
                >
                  Disabled
                </Label>
                <Switch
                  id="clear-free-shipping"
                  checked={clearFreeShipping}
                  onCheckedChange={setClearFreeShipping}
                  disabled={!canUpdate}
                />
              </div>
            </div>
            <Input
              id="free-shipping-min"
              type="number"
              min={0}
              step="1"
              value={freeShippingMinAmount}
              onChange={(e) => setFreeShippingMinAmount(e.target.value)}
              disabled={!canUpdate || clearFreeShipping}
              placeholder="e.g. 10000"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Announcement bar</p>
              <p className="text-xs text-muted-foreground">
                Shown across the storefront when active.
              </p>
            </div>
            <Switch
              checked={announcementIsActive}
              onCheckedChange={setAnnouncementIsActive}
              disabled={!canUpdate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement-text">Text</Label>
            <Textarea
              id="announcement-text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              disabled={!canUpdate}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement-link">Link URL</Label>
            <Input
              id="announcement-link"
              value={announcementLinkUrl}
              onChange={(e) => setAnnouncementLinkUrl(e.target.value)}
              disabled={!canUpdate}
              placeholder="/products?tag=isNewArrival"
            />
          </div>
        </div>

        {canUpdate && (
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save fees & announcement"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
