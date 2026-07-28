import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ClipboardList, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConvertCustomizationRequestDialog } from "@/components/customization-requests/ConvertCustomizationRequestDialog";
import { CustomizationRequestEditCard } from "@/components/customization-requests/CustomizationRequestEditCard";
import { CustomizationRequestStatusBadge } from "@/components/customization-requests/CustomizationRequestStatusBadge";
import { CustomizationMaterialsHighlight } from "@/components/customization-requests/CustomizationMaterialsHighlight";
import { getCustomizationRequestMaterialChips } from "@/lib/order-customization-materials";
import { RejectCustomizationRequestDialog } from "@/components/customization-requests/RejectCustomizationRequestDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import {
  canApproveCustomizationRequest,
  canConvertCustomizationRequest,
  canEditCustomizationRequest,
  canRejectCustomizationRequest,
} from "@/lib/customization-request-status";
import { formatDate, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  approveCustomizationRequest,
  convertCustomizationRequestToOrder,
  getCustomizationRequest,
  rejectCustomizationRequest,
  updateCustomizationRequest,
} from "@/services/customization-requests.service";
import type { ConvertCustomizationRequestResult } from "@/types/customization-request";

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

function staffLabel(staff: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const name = [staff.firstName, staff.lastName].filter(Boolean).join(" ");
  return name || staff.email;
}

export function CustomizationRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_CUSTOMIZATION_REQUESTS);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_CUSTOMIZATION_REQUESTS);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertResult, setConvertResult] =
    useState<ConvertCustomizationRequestResult | null>(null);

  const requestQuery = useQuery({
    queryKey: queryKeys.customizationRequests.detail(requestId),
    queryFn: () => getCustomizationRequest(requestId),
    enabled: canView && Number.isFinite(requestId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.customizationRequests.detail(requestId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.customizationRequests.all,
    });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveCustomizationRequest(requestId),
    onSuccess: () => {
      toast.success("Request approved");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to approve",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: Parameters<typeof rejectCustomizationRequest>[1]) =>
      rejectCustomizationRequest(requestId, payload),
    onSuccess: () => {
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateCustomizationRequest>[1]) =>
      updateCustomizationRequest(requestId, payload),
    onSuccess: () => {
      invalidate();
    },
  });

  const convertMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof convertCustomizationRequestToOrder>[1],
    ) => convertCustomizationRequestToOrder(requestId, payload),
    onSuccess: (result) => {
      setConvertResult(result);
      toast.success("Order created — share the payment link with the customer");
      invalidate();
    },
  });

  async function copyPaymentLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Payment link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Customization request" />
        <EmptyState
          icon={ClipboardList}
          title="Access restricted"
          description="You do not have permission to view customization requests."
        />
      </div>
    );
  }

  if (requestQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requestQuery.isError || !requestQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Customization request" />
        <EmptyState
          icon={ClipboardList}
          title="Request not found"
          description={
            requestQuery.error instanceof Error
              ? requestQuery.error.message
              : "Could not load this request."
          }
        />
        <Link
          to="/customization-requests"
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Back to inbox
        </Link>
      </div>
    );
  }

  const request = requestQuery.data;
  const editable = canEditCustomizationRequest(request.status);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={request.productName}
        description={`Request #${request.id}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CustomizationRequestStatusBadge status={request.status} />
            <Link
              to="/customization-requests"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <ArrowLeft className="size-4" />
              Back to inbox
            </Link>
          </div>
        }
      />

      {canUpdate && (
        <div className="flex flex-wrap gap-2">
          {canApproveCustomizationRequest(request.status) && (
            <Button
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              <Check className="size-4" />
              Approve
            </Button>
          )}
          {canRejectCustomizationRequest(request.status) && (
            <Button
              variant="outline"
              onClick={() => setRejectOpen(true)}
              disabled={rejectMutation.isPending}
            >
              <X className="size-4" />
              Reject
            </Button>
          )}
          {canConvertCustomizationRequest(request.status) && (
            <Button onClick={() => setConvertOpen(true)}>
              Convert to order
            </Button>
          )}
        </div>
      )}

      {(convertResult?.paymentLinkUrl || request.order) && (
        <Card className="border-[#8B5E3C]/30 bg-[#F8F1E8]/50">
          <CardHeader>
            <CardTitle>Payment link</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-sm break-all">
              {convertResult?.paymentLinkUrl ??
                "Order created — open the order for payment details."}
            </p>
            {convertResult?.paymentLinkUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyPaymentLink(convertResult.paymentLinkUrl)}
              >
                <Copy className="size-4" />
                Copy link
              </Button>
            )}
            {(convertResult?.order?.id ?? request.orderId) && (
              <Link
                to={`/orders/${convertResult?.order?.id ?? request.orderId}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View order
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Request details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Description</p>
                <p className="mt-1 whitespace-pre-wrap">{request.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium">{request.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(request.createdAt)}</p>
                </div>
              </div>

              <CustomizationMaterialsHighlight
                materials={getCustomizationRequestMaterialChips(request)}
                className="mt-2"
              />

              {request.referenceImage?.url && (
                <div>
                  <p className="text-muted-foreground">Reference image</p>
                  <img
                    src={request.referenceImage.url}
                    alt="Customer reference"
                    className="mt-2 max-h-64 rounded-lg border object-cover"
                  />
                </div>
              )}

              {request.rejectionReason && (
                <div>
                  <p className="text-muted-foreground">Rejection reason</p>
                  <p className="mt-1">{request.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {request.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-line">
                {formatAddress(request.shippingAddress)}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {request.customer && (
                <Link
                  to={`/customers/${request.customer.id}`}
                  className="font-medium hover:underline"
                >
                  {formatPhone(request.customer.phone)}
                </Link>
              )}
              {request.reviewedAt && (
                <div>
                  <p className="text-muted-foreground">Reviewed</p>
                  <p className="font-medium">{formatDate(request.reviewedAt)}</p>
                  {request.reviewedByStaff && (
                    <p className="text-muted-foreground">
                      by {staffLabel(request.reviewedByStaff)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {request.productId && request.product && (
            <Card>
              <CardHeader>
                <CardTitle>Custom product</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/products/${request.product.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {request.product.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Hidden from storefront (inactive)
                </p>
              </CardContent>
            </Card>
          )}

          {canUpdate && editable && (
            <CustomizationRequestEditCard
              request={request}
              loading={updateMutation.isPending}
              onSubmit={(payload) => updateMutation.mutateAsync(payload)}
            />
          )}
        </div>
      </div>

      <RejectCustomizationRequestDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        loading={rejectMutation.isPending}
        onSubmit={(payload) => rejectMutation.mutateAsync(payload)}
      />

      <ConvertCustomizationRequestDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        request={request}
        loading={convertMutation.isPending}
        onSubmit={(payload) => convertMutation.mutateAsync(payload)}
      />
    </div>
  );
}
