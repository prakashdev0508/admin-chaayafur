import { Newspaper } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import { MediaItemsPanel } from "@/pages/content/MediaItemsPanel";
import { MediaVendorsPanel } from "@/pages/content/MediaVendorsPanel";

export function MediaPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_MEDIA);

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Media"
          description="Press vendors and editorial coverage."
        />
        <EmptyState
          icon={Newspaper}
          title="Access restricted"
          description="You do not have permission to view media."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Media"
        description="Add a vendor, then attach coverage with a link, cover, and description."
      />
      <Tabs defaultValue="vendors">
        <TabsList>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
        </TabsList>
        <TabsContent value="vendors" className="pt-2">
          <MediaVendorsPanel />
        </TabsContent>
        <TabsContent value="coverage" className="pt-2">
          <MediaItemsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
