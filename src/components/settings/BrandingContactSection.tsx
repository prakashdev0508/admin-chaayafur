import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrandingImageUploader } from "@/components/settings/BrandingImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  uploadFaviconImage,
  uploadLogoImage,
} from "@/services/uploads.service";
import type { AdminSiteSettings } from "@/types/site-settings";

type BrandingContactSectionProps = {
  settings: AdminSiteSettings;
  canUpdate: boolean;
};

export function BrandingContactSection({
  settings,
  canUpdate,
}: BrandingContactSectionProps) {
  const queryClient = useQueryClient();
  const [logo, setLogo] = useState<{ url: string; storageKey?: string } | null>(
    settings.logoUrl
      ? { url: settings.logoUrl, storageKey: settings.logoStorageKey ?? undefined }
      : null,
  );
  const [favicon, setFavicon] = useState<{
    url: string;
    storageKey?: string;
  } | null>(
    settings.faviconUrl
      ? {
          url: settings.faviconUrl,
          storageKey: settings.faviconStorageKey ?? undefined,
        }
      : null,
  );
  const [phone, setPhone] = useState(settings.phone ?? "");
  const [email, setEmail] = useState(settings.email ?? "");
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp ?? "");
  const [showroomAddress, setShowroomAddress] = useState(
    settings.showroomAddress ?? "",
  );
  const [businessHours, setBusinessHours] = useState(
    settings.businessHours ?? "",
  );
  const [gstin, setGstin] = useState(settings.gstin ?? "");
  const [instagram, setInstagram] = useState(
    settings.socialLinks?.instagram ?? "",
  );
  const [facebook, setFacebook] = useState(
    settings.socialLinks?.facebook ?? "",
  );

  useEffect(() => {
    setLogo(
      settings.logoUrl
        ? {
            url: settings.logoUrl,
            storageKey: settings.logoStorageKey ?? undefined,
          }
        : null,
    );
    setFavicon(
      settings.faviconUrl
        ? {
            url: settings.faviconUrl,
            storageKey: settings.faviconStorageKey ?? undefined,
          }
        : null,
    );
    setPhone(settings.phone ?? "");
    setEmail(settings.email ?? "");
    setWhatsapp(settings.whatsapp ?? "");
    setShowroomAddress(settings.showroomAddress ?? "");
    setBusinessHours(settings.businessHours ?? "");
    setGstin(settings.gstin ?? "");
    setInstagram(settings.socialLinks?.instagram ?? "");
    setFacebook(settings.socialLinks?.facebook ?? "");
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: updateAdminSiteSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.siteSettings,
      });
      toast.success("Branding & contact saved");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    },
  });

  function handleSave() {
    const socialLinks: Record<string, string> = {};
    if (instagram.trim()) socialLinks.instagram = instagram.trim();
    if (facebook.trim()) socialLinks.facebook = facebook.trim();

    saveMutation.mutate({
      logoUrl: logo?.url ?? null,
      logoStorageKey: logo?.storageKey ?? null,
      faviconUrl: favicon?.url ?? null,
      faviconStorageKey: favicon?.storageKey ?? null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      whatsapp: whatsapp.trim() || null,
      showroomAddress: showroomAddress.trim() || null,
      businessHours: businessHours.trim() || null,
      gstin: gstin.trim() || null,
      socialLinks,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding & contact</CardTitle>
        <CardDescription>
          Logo, favicon, and storefront contact details. GSTIN appears on
          invoice PDFs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <BrandingImageUploader
            label="Logo"
            hint="Shown in storefront chrome. Upload first, then save."
            image={logo}
            onChange={setLogo}
            onUpload={uploadLogoImage}
            disabled={!canUpdate || saveMutation.isPending}
            aspectClassName="aspect-[3/1] max-w-sm"
          />
          <BrandingImageUploader
            label="Favicon"
            hint="Browser tab icon. Square images work best."
            image={favicon}
            onChange={setFavicon}
            onUpload={uploadFaviconImage}
            disabled={!canUpdate || saveMutation.isPending}
            aspectClassName="aspect-square max-w-[120px]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-phone">Phone</Label>
            <Input
              id="settings-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!canUpdate}
              placeholder="+919876543210"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-whatsapp">WhatsApp</Label>
            <Input
              id="settings-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={!canUpdate}
              placeholder="+919876543210"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!canUpdate}
              placeholder="hello@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-gstin">GSTIN</Label>
            <Input
              id="settings-gstin"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              disabled={!canUpdate}
              placeholder="29AAAAA0000A1Z5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-address">Showroom address</Label>
          <Textarea
            id="settings-address"
            value={showroomAddress}
            onChange={(e) => setShowroomAddress(e.target.value)}
            disabled={!canUpdate}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-hours">Business hours</Label>
          <Input
            id="settings-hours"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            disabled={!canUpdate}
            placeholder="Mon–Sat 10:00–19:00; Sun closed"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-instagram">Instagram</Label>
            <Input
              id="settings-instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              disabled={!canUpdate}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-facebook">Facebook</Label>
            <Input
              id="settings-facebook"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              disabled={!canUpdate}
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>

        {canUpdate && (
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save branding & contact"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
