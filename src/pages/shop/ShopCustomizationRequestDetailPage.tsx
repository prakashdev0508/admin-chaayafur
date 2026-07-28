import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { CustomizationRequestStatusBadge } from "@/components/customization-requests/CustomizationRequestStatusBadge";
import { CustomizationMaterialsHighlight } from "@/components/customization-requests/CustomizationMaterialsHighlight";
import { getCustomizationRequestMaterialChips } from "@/lib/order-customization-materials";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { getMyCustomizationRequest } from "@/services/shop-customization-requests.service";

function formatAddress(address: {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}) {
  const parts = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.zipCode}`,
    address.country,
  ].filter(Boolean);
  return parts.join("\n");
}

export function ShopCustomizationRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);

  const requestQuery = useQuery({
    queryKey: queryKeys.shop.customizationRequests.detail(requestId),
    queryFn: () => getMyCustomizationRequest(requestId),
    enabled: Number.isFinite(requestId),
  });

  if (requestQuery.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requestQuery.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-muted-foreground">Request not found.</p>
        <Link
          to="/shop/customize/requests"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to requests
        </Link>
      </div>
    );
  }

  const request = requestQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium text-[#3D2B1F]">
            {request.productName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Request #{request.id} · Submitted {formatDate(request.createdAt)}
          </p>
        </div>
        <CustomizationRequestStatusBadge status={request.status} />
      </div>

      {request.status === "CONVERTED" && request.orderId && (
        <div className="rounded-2xl border border-[#E8DFD3] bg-[#F8F1E8] p-4">
          <p className="text-sm font-medium text-[#3D2B1F]">
            Your custom order is ready for payment
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open your order to complete payment when our team shares the link.
          </p>
          <Link
            to={`/shop/orders/${request.orderId}`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "mt-3 bg-[#8B5E3C] hover:bg-[#744C31]",
            )}
          >
            View order & pay
          </Link>
        </div>
      )}

      {request.rejectionReason && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-medium text-red-900">Reason for rejection</p>
          <p className="mt-1 text-red-800">{request.rejectionReason}</p>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-[#E8DFD3] bg-white p-6 text-sm">
        <div>
          <p className="text-muted-foreground">Description</p>
          <p className="mt-1 whitespace-pre-wrap">{request.description}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Quantity</p>
          <p className="mt-1 font-medium">{request.quantity}</p>
        </div>
        <CustomizationMaterialsHighlight
          materials={getCustomizationRequestMaterialChips(request)}
          variant="shop"
          title="Your material choices"
        />
        {request.referenceImage?.url && (
          <div>
            <p className="text-muted-foreground">Reference image</p>
            <img
              src={request.referenceImage.url}
              alt="Reference"
              className="mt-2 max-h-64 rounded-xl border object-cover"
            />
          </div>
        )}
        {request.shippingAddress && (
          <div>
            <p className="text-muted-foreground">Shipping address</p>
            <p className="mt-1 whitespace-pre-line">
              {formatAddress(request.shippingAddress)}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          to="/shop/customize/requests"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          All requests
        </Link>
        <Link
          to="/shop/customize"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          New request
        </Link>
      </div>
    </div>
  );
}
