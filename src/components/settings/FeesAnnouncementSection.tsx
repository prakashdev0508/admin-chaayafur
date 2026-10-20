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
  const [floorDeliveryChargePerFloor, setFloorDeliveryChargePerFloor] =
    useState(settings.floorDeliveryChargePerFloor ?? "");
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
  const [loginBonusIsActive, setLoginBonusIsActive] = useState(
    settings.loginBonusIsActive ?? false,
  );
  const [loginBonusAmount, setLoginBonusAmount] = useState(
    settings.loginBonusAmount ?? "0",
  );
  const [walletRedemptionMaxAmount, setWalletRedemptionMaxAmount] = useState(
    settings.walletRedemptionMaxAmount ?? "1000",
  );
  const [walletRedemptionMinOrderAmount, setWalletRedemptionMinOrderAmount] =
    useState(settings.walletRedemptionMinOrderAmount ?? "10000");

  useEffect(() => {
    setFlatShippingFee(settings.flatShippingFee ?? "");
    setFreeShippingMinAmount(settings.freeShippingMinAmount ?? "");
    setFloorDeliveryChargePerFloor(
      settings.floorDeliveryChargePerFloor ?? "",
    );
    setClearFreeShipping(settings.freeShippingMinAmount == null);
    setAnnouncementText(settings.announcementText ?? "");
    setAnnouncementLinkUrl(settings.announcementLinkUrl ?? "");
    setAnnouncementIsActive(settings.announcementIsActive);
    setLoginBonusIsActive(settings.loginBonusIsActive ?? false);
    setLoginBonusAmount(settings.loginBonusAmount ?? "0");
    setWalletRedemptionMaxAmount(settings.walletRedemptionMaxAmount ?? "1000");
    setWalletRedemptionMinOrderAmount(
      settings.walletRedemptionMinOrderAmount ?? "10000",
    );
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

    const floorRate = Number(floorDeliveryChargePerFloor);
    if (!Number.isFinite(floorRate) || floorRate < 0) {
      toast.error("Enter a valid floor delivery charge per floor");
      return;
    }

    const bonusAmount = Number(loginBonusAmount);
    if (!Number.isFinite(bonusAmount) || bonusAmount < 0) {
      toast.error("Enter a valid login bonus amount");
      return;
    }

    const redemptionMax = Number(walletRedemptionMaxAmount);
    if (!Number.isFinite(redemptionMax) || redemptionMax < 0) {
      toast.error("Enter a valid wallet redemption max amount");
      return;
    }

    const redemptionMinOrder = Number(walletRedemptionMinOrderAmount);
    if (!Number.isFinite(redemptionMinOrder) || redemptionMinOrder < 0) {
      toast.error("Enter a valid wallet redemption min order amount");
      return;
    }

    saveMutation.mutate({
      flatShippingFee: fee,
      freeShippingMinAmount: freeMin,
      floorDeliveryChargePerFloor: floorRate,
      announcementText: announcementText.trim() || null,
      announcementLinkUrl: announcementLinkUrl.trim() || null,
      announcementIsActive,
      loginBonusIsActive,
      loginBonusAmount: bonusAmount,
      walletRedemptionMaxAmount: redemptionMax,
      walletRedemptionMinOrderAmount: redemptionMinOrder,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fees & announcement</CardTitle>
        <CardDescription>
          Flat shipping fee, free-shipping threshold, and per-floor delivery
          labor apply at checkout. Pincode allowlists are managed separately.
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="floor-delivery-rate">
              Floor delivery charge per floor (INR)
            </Label>
            <Input
              id="floor-delivery-rate"
              type="number"
              min={0}
              step="1"
              value={floorDeliveryChargePerFloor}
              onChange={(e) => setFloorDeliveryChargePerFloor(e.target.value)}
              disabled={!canUpdate}
              placeholder="e.g. 300"
            />
            <p className="text-xs text-muted-foreground">
              Ground floor = ₹0; Nth floor = N × this rate when lift access is
              not available at checkout. Not waived by free shipping.
            </p>
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

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Login bonus</p>
              <p className="text-xs text-muted-foreground">
                One-time wallet credit on customer OTP login. Inactive or amount
                ₹0 means no credits are sent.
              </p>
            </div>
            <Switch
              checked={loginBonusIsActive}
              onCheckedChange={setLoginBonusIsActive}
              disabled={!canUpdate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-bonus-amount">Bonus amount (INR)</Label>
            <Input
              id="login-bonus-amount"
              type="number"
              min={0}
              step="1"
              value={loginBonusAmount}
              onChange={(e) => setLoginBonusAmount(e.target.value)}
              disabled={!canUpdate}
              placeholder="e.g. 1000"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Wallet redemption</p>
            <p className="text-xs text-muted-foreground">
              Caps for checkout wallet discounts. Max ₹0 disables redemption.
              Customers see these on their wallet and at checkout.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wallet-redemption-max">
                Max redeemable per order (INR)
              </Label>
              <Input
                id="wallet-redemption-max"
                type="number"
                min={0}
                step="1"
                value={walletRedemptionMaxAmount}
                onChange={(e) => setWalletRedemptionMaxAmount(e.target.value)}
                disabled={!canUpdate}
                placeholder="e.g. 1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet-redemption-min-order">
                Min order after coupon (INR)
              </Label>
              <Input
                id="wallet-redemption-min-order"
                type="number"
                min={0}
                step="1"
                value={walletRedemptionMinOrderAmount}
                onChange={(e) =>
                  setWalletRedemptionMinOrderAmount(e.target.value)
                }
                disabled={!canUpdate}
                placeholder="e.g. 10000"
              />
            </div>
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
