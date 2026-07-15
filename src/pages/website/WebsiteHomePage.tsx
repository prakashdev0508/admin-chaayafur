import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Globe, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { HomeBannerSection } from "@/components/website/HomeBannerSection";
import { HomeCmsTagSection } from "@/components/website/HomeCmsTagSection";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePermission } from "@/hooks/usePermission";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { ProductMerchandisingTag } from "@/types/product";
import { PERMISSIONS } from "@/lib/roles";

const CMS_SECTIONS: {
  tag: ProductMerchandisingTag;
  description: string;
}[] = [
  {
    tag: "isFeaturedProduct",
    description: "Shown in the Featured section on the shop homepage.",
  },
  {
    tag: "isBestSeller",
    description: "Shown in Best sellers on the shop homepage.",
  },
  {
    tag: "isNewArrival",
    description: "Shown in New arrivals on the shop homepage.",
  },
  {
    tag: "isMostPopular",
    description: "Shown in Most popular on the shop homepage.",
  },
];

export function WebsiteHomePage() {
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();

  const canView = hasPermission(PERMISSIONS.VIEW_BANNERS);
  const canCreateBanners = hasPermission(PERMISSIONS.CREATE_BANNERS);
  const canUpdateBanners = hasPermission(PERMISSIONS.UPDATE_BANNERS);
  const canUpdateProducts = hasPermission(PERMISSIONS.UPDATE_PRODUCTS);

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Home"
          description="Control banners and merchandising on the storefront homepage."
        />
        <EmptyState
          icon={Globe}
          title="Access restricted"
          description="You do not have permission to manage the website homepage."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Home"
        description="Manage everything that appears on the shop homepage — banners and CMS product sections."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh homepage CMS data"
              onClick={() => {
                void queryClient.invalidateQueries({
                  queryKey: queryKeys.admin.banners.all,
                });
                void queryClient.invalidateQueries({ queryKey: ["products"] });
                void queryClient.invalidateQueries({
                  queryKey: queryKeys.shop.home,
                });
              }}
            >
              <RefreshCw className="size-4" />
            </Button>
            <Link
              to="/shop"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <ExternalLink className="size-4" />
              View storefront
            </Link>
          </div>
        }
      />

      <HomeBannerSection
        type="MAIN"
        title="Main banners"
        description="Carousel slides on the left of the homepage hero. Use ← → to change order."
        canCreate={canCreateBanners}
        canUpdate={canUpdateBanners}
      />

      <HomeBannerSection
        type="SUB"
        title="Sub banners"
        description="Promo cards beside the carousel. The storefront shows up to two active cards."
        canCreate={canCreateBanners}
        canUpdate={canUpdateBanners}
      />

      {CMS_SECTIONS.map((section) => (
        <HomeCmsTagSection
          key={section.tag}
          tag={section.tag}
          description={section.description}
          canUpdate={canUpdateProducts}
        />
      ))}
    </div>
  );
}
