import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { BrandingContactSection } from "@/components/settings/BrandingContactSection";
import { FeesAnnouncementSection } from "@/components/settings/FeesAnnouncementSection";
import { PincodesSection } from "@/components/settings/PincodesSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermission } from "@/hooks/usePermission";
import { queryKeys } from "@/lib/query-keys";
import { getAdminSiteSettings } from "@/services/site-settings.service";

export function SettingsPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission("view-settings");
  const canUpdate = hasPermission("update-settings");

  const settingsQuery = useQuery({
    queryKey: queryKeys.admin.siteSettings,
    queryFn: getAdminSiteSettings,
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Settings"
          description="Storefront branding, shipping fees, and pincode serviceability."
        />
        <EmptyState
          icon={Settings}
          title="Access restricted"
          description="You do not have permission to view site settings."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Storefront branding, shipping fees, announcement bar, and pincode allowlist."
      />

      {settingsQuery.isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : settingsQuery.error || !settingsQuery.data ? (
        <EmptyState
          icon={Settings}
          title="Could not load settings"
          description={
            settingsQuery.error instanceof Error
              ? settingsQuery.error.message
              : "Try refreshing the page."
          }
        />
      ) : (
        <Tabs defaultValue="branding" className="gap-6">
          <TabsList
            variant="line"
            className="h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b bg-transparent p-0"
          >
            <TabsTrigger
              value="branding"
              className="rounded-none px-4 py-3 after:bottom-0 data-active:after:h-0.5"
            >
              Branding & contact
            </TabsTrigger>
            <TabsTrigger
              value="fees"
              className="rounded-none px-4 py-3 after:bottom-0 data-active:after:h-0.5"
            >
              Fees & announcement
            </TabsTrigger>
            <TabsTrigger
              value="pincodes"
              className="rounded-none px-4 py-3 after:bottom-0 data-active:after:h-0.5"
            >
              Pincodes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-0">
            <BrandingContactSection
              settings={settingsQuery.data}
              canUpdate={canUpdate}
            />
          </TabsContent>
          <TabsContent value="fees" className="mt-0">
            <FeesAnnouncementSection
              settings={settingsQuery.data}
              canUpdate={canUpdate}
            />
          </TabsContent>
          <TabsContent value="pincodes" className="mt-0">
            <PincodesSection canUpdate={canUpdate} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
