import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import {
  QUOTATION_STATUS_ITEMS,
  formatQuoteRupees,
  quotationStatusLabel,
  quotationStatusVariant,
  taxableAmount,
} from "@/lib/quotation";
import { queryKeys } from "@/lib/query-keys";
import { isValidGstin } from "@/lib/address-utils";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import {
  addQuotationRemark,
  convertQuotationToOrder,
  getQuotation,
  sendQuotationEmail,
  updateQuotation,
} from "@/services/quotations.service";
import type { QuotationStatus } from "@/types/quotation";
import type { ConvertQuotationToOrderPayload, OrderAddressSnapshot } from "@/types/order";

export function QuotationDetailPage() {
  const { id } = useParams();
  const quotationId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_QUOTATIONS);

  const [status, setStatus] = useState<QuotationStatus | "">("");
  const [remark, setRemark] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertPhone, setConvertPhone] = useState("");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [deliveryFloor, setDeliveryFloor] = useState(0);
  const [liftAccessAvailable, setLiftAccessAvailable] = useState(false);
  const [shipping, setShipping] = useState<OrderAddressSnapshot | null>(null);
  const [billing, setBilling] = useState<OrderAddressSnapshot | null>(null);

  const { data: quotation, isLoading } = useQuery({
    queryKey: queryKeys.quotations.detail(quotationId),
    queryFn: () => getQuotation(quotationId),
    enabled: Number.isFinite(quotationId),
  });

  const displayedStatus = status || quotation?.status || "SENT";

  const statusMutation = useMutation({
    mutationFn: () =>
      updateQuotation(quotationId, { status: displayedStatus }),
    onSuccess: (updated) => {
      setStatus(updated.status);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.detail(quotationId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.all,
      });
      toast.success("Status updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status",
      );
    },
  });

  const remarkMutation = useMutation({
    mutationFn: (text: string) => addQuotationRemark(quotationId, text),
    onSuccess: () => {
      setRemark("");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.detail(quotationId),
      });
      toast.success("Remark added");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to add remark",
      );
    },
  });

  const emailMutation = useMutation({
    mutationFn: () => sendQuotationEmail(quotationId),
    onSuccess: (result) => {
      toast.success(
        result.sent
          ? `Email sent to ${result.to}`
          : `Email skipped (mail disabled). Would send to ${result.to}`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to send email",
      );
    },
  });

  const convertMutation = useMutation({
    mutationFn: (payload: ConvertQuotationToOrderPayload) =>
      convertQuotationToOrder(quotationId, payload),
    onSuccess: (order) => {
      toast.success("Order created from quotation");
      setConvertOpen(false);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(order.id),
      });
      navigate(`/orders/${order.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to convert to order",
      );
    },
  });

  useEffect(() => {
    if (!convertOpen || !quotation) return;

    const parts = quotation.address
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const zipMatch = quotation.address.match(/\b(\d{6})\b/);
    const zipCode = zipMatch?.[1] ?? "";
    const state = parts.length >= 2 ? parts[parts.length - 2] ?? "" : "";
    const city = parts.length >= 3 ? parts[parts.length - 3] ?? "" : "";
    const line1 =
      parts.length >= 3 ? parts.slice(0, parts.length - 3).join(", ") : "";

    const baseShipping: OrderAddressSnapshot = {
      name: quotation.customerName,
      email: quotation.email ?? undefined,
      phone: quotation.mobileNumber,
      line1: line1 || quotation.address,
      line2: undefined,
      city,
      state,
      zipCode,
      country: "IN",
    };

    setConvertPhone(quotation.mobileNumber);
    setBillingSameAsShipping(true);
    setDeliveryFloor(0);
    setLiftAccessAvailable(false);
    setShipping(baseShipping);
    setBilling(baseShipping);
  }, [convertOpen, quotation]);

  async function handleConvertToOrder() {
    const phone = convertPhone.trim();
    if (!phone) {
      toast.error("Phone is required");
      return;
    }
    if (!shipping) {
      toast.error("Shipping details are missing");
      return;
    }
    if (!shipping.name.trim() || !shipping.line1.trim()) {
      toast.error("Shipping name/address are required");
      return;
    }
    if (!shipping.city.trim() || !shipping.state.trim() || !shipping.zipCode.trim()) {
      toast.error("Shipping city/state/PIN are required");
      return;
    }
    if (!isValidGstin(shipping.gstin ?? "")) {
      toast.error("Shipping GSTIN must be 15 characters when provided");
      return;
    }
    if (!billingSameAsShipping) {
      if (!billing) {
        toast.error("Billing details are required");
        return;
      }
      if (!billing.name.trim() || !billing.line1.trim()) {
        toast.error("Billing name/address are required");
        return;
      }
      if (!billing.city.trim() || !billing.state.trim() || !billing.zipCode.trim()) {
        toast.error("Billing city/state/PIN are required");
        return;
      }
      if (!isValidGstin(billing.gstin ?? "")) {
        toast.error("Billing GSTIN must be 15 characters when provided");
        return;
      }
    }

    const payload: ConvertQuotationToOrderPayload = {
      phone,
      billingSameAsShipping,
      deliveryFloor,
      liftAccessAvailable,
      shipping: { ...shipping, phone },
      ...(billingSameAsShipping ? {} : { billing: { ...billing!, phone } }),
    };

    await convertMutation.mutateAsync(payload);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Quotation not found" />
        <Button
          variant="outline"
          render={<Link to="/quotations">Back to quotations</Link>}
        />
      </div>
    );
  }

  const remarks = quotation.followUpRemarks ?? [];
  const canConvert =
    canUpdate &&
    hasPermission(PERMISSIONS.CREATE_ORDERS) &&
    (quotation.status === "SENT" || quotation.status === "FOLLOW_UP");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={quotation.quotationNumber}
        description={`${quotation.customerName} · ${formatPhone(quotation.mobileNumber)}`}
        action={
          <div className="flex flex-wrap gap-2">
            {quotation.pdfUrl ? (
              <Button
                variant="outline"
                render={
                  <a
                    href={quotation.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    Open PDF
                  </a>
                }
              />
            ) : null}
            {canUpdate ? (
              <Button
                variant="outline"
                render={
                  <Link to={`/quotations/${quotation.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                }
              />
            ) : null}
            {canUpdate ? (
              <Button
                onClick={() => emailMutation.mutate()}
                disabled={emailMutation.isPending || !quotation.email}
              >
                {emailMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Send email
              </Button>
            ) : null}
            {canConvert ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConvertOpen(true)}
                disabled={convertMutation.isPending}
              >
                Convert to order
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              <span className="text-right">{quotation.customerName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Mobile</span>
              <span>{formatPhone(quotation.mobileNumber)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="text-right">{quotation.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Valid until</span>
              <span>
                {formatDate(quotation.validUntil, {
                  dateStyle: "medium",
                  timeStyle: undefined,
                })}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Address</span>
              <span className="max-w-[60%] text-right whitespace-pre-wrap">
                {quotation.address}
              </span>
            </div>
            {quotation.notes ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Notes</span>
                <span className="max-w-[60%] text-right whitespace-pre-wrap">
                  {quotation.notes}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(quotation.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
            <CardTitle>Status</CardTitle>
            <StatusBadge variant={quotationStatusVariant(quotation.status)}>
              {quotationStatusLabel(quotation.status)}
            </StatusBadge>
            </div>
            <CardDescription>
              {canUpdate
                ? "Update follow-up state for this quote."
                : "You can view status but need update-quotations to change it."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Quotation status</Label>
              
              <Select
                value={displayedStatus}
                onValueChange={(value) => {
                  if (!value) return;
                  setStatus(value as QuotationStatus);
                }}
                items={QUOTATION_STATUS_ITEMS}
                disabled={!canUpdate || statusMutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTATION_STATUS_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canUpdate ? (
              <Button
                disabled={
                  statusMutation.isPending ||
                  displayedStatus === quotation.status
                }
                onClick={() => statusMutation.mutate()}
              >
                {statusMutation.isPending ? "Saving…" : "Save status"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>Quoted prices snapshotted at save.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.productName}
                    {product.productId == null ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (removed from catalog)
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuoteRupees(product.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuoteRupees(product.lineTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right">
                  Taxable
                </TableCell>
                <TableCell className="text-right">
                  {formatQuoteRupees(taxableAmount(Number(quotation.totalPrice)))}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right">
                  GST
                </TableCell>
                <TableCell className="text-right">
                  {formatQuoteRupees(quotation.gstAmount)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(quotation.totalPrice)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up remarks</CardTitle>
          <CardDescription>Append-only notes on this quotation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {remarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No remarks yet.</p>
          ) : (
            <ul className="space-y-3">
              {remarks.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <p className="whitespace-pre-wrap">{item.remark}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {canUpdate ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const text = remark.trim();
                if (!text) {
                  toast.error("Enter a remark.");
                  return;
                }
                remarkMutation.mutate(text);
              }}
            >
              <Textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Called customer; will decide after Diwali"
                rows={3}
              />
              <Button
                type="submit"
                disabled={remarkMutation.isPending || !remark.trim()}
              >
                {remarkMutation.isPending ? "Adding…" : "Add remark"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={convertOpen}
        onOpenChange={(open) => {
          setConvertOpen(open);
          if (!open) {
            setShipping(null);
            setBilling(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[70vw] max-w-[70vw]">
          <DialogHeader>
            <DialogTitle>Convert to manual order</DialogTitle>
            <DialogDescription>
              Create a MANUAL order from the quoted lines. Stock is decremented for
              catalog lines only; custom/off-catalog lines are snapshotted as-is.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleConvertToOrder();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="convert-phone">Customer phone</Label>
                <Input
                  id="convert-phone"
                  value={convertPhone}
                  onChange={(e) => {
                    const next = e.target.value;
                    setConvertPhone(next);
                    setShipping((s) => (s ? { ...s, phone: next } : s));
                    setBilling((b) => (b ? { ...b, phone: next } : b));
                  }}
                />
              </div>


            </div>
            <div className="space-y-2">
                <div className="flex items-center">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Delivery floor</p>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={deliveryFloor}
                      onChange={(e) =>
                        setDeliveryFloor(Number.parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1 ml-2">
                    <p className="text-sm font-medium">Lift access</p>
                    <Switch
                      checked={liftAccessAvailable}
                      onCheckedChange={setLiftAccessAvailable}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Billing same as shipping</p>
                    <p className="text-xs text-muted-foreground">
                      When enabled, backend stores only a shipping snapshot.
                    </p>
                  </div>
                  <Switch
                    checked={billingSameAsShipping}
                    onCheckedChange={(v) => setBillingSameAsShipping(v)}
                  />
                </div>
              </div>

            <div className="space-y-2">
              <Label>Shipping snapshot</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shipping-name">Name</Label>
                  <Input
                    id="shipping-name"
                    value={shipping?.name ?? ""}
                    onChange={(e) =>
                      setShipping((s) =>
                        s ? { ...s, name: e.target.value } : s,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-email">Email (optional)</Label>
                  <Input
                    id="shipping-email"
                    value={shipping?.email ?? ""}
                    onChange={(e) =>
                      setShipping((s) =>
                        s
                          ? {
                              ...s,
                              email: e.target.value || undefined,
                            }
                          : s,
                      )
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shipping-line1">Address line 1</Label>
                  <Input
                    id="shipping-line1"
                    value={shipping?.line1 ?? ""}
                    onChange={(e) =>
                      setShipping((s) =>
                        s ? { ...s, line1: e.target.value } : s,
                      )
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shipping-line2">Address line 2 (optional)</Label>
                  <Input
                    id="shipping-line2"
                    value={shipping?.line2 ?? ""}
                    onChange={(e) =>
                      setShipping((s) =>
                        s ? { ...s, line2: e.target.value || undefined } : s,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping-city">City</Label>
                  <Input
                    id="shipping-city"
                    value={shipping?.city ?? ""}
                    onChange={(e) =>
                      setShipping((s) =>
                        s ? { ...s, city: e.target.value } : s,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-state">State</Label>
                  <Input
                    id="shipping-state"
                    value={shipping?.state ?? ""}
                    onChange={(e) =>
                      setShipping((s) =>
                        s ? { ...s, state: e.target.value } : s,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-zip">PIN code</Label>
                  <Input
                    id="shipping-zip"
                    value={shipping?.zipCode ?? ""}
                    onChange={(e) =>
                      setShipping((s) =>
                        s
                          ? {
                              ...s,
                              zipCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                            }
                          : s,
                      )
                    }
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-country">Country</Label>
                  <Input
                    id="shipping-country"
                    value={shipping?.country ?? "IN"}
                    onChange={(e) =>
                      setShipping((s) =>
                        s ? { ...s, country: e.target.value } : s,
                      )
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shipping-gstin">
                    GSTIN{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="shipping-gstin"
                    value={shipping?.gstin ?? ""}
                    onChange={(e) =>
                      setShipping((s) =>
                        s
                          ? {
                              ...s,
                              gstin:
                                e.target.value
                                  .toUpperCase()
                                  .replace(/\s/g, "")
                                  .slice(0, 15) || undefined,
                            }
                          : s,
                      )
                    }
                    placeholder="15-character GSTIN"
                    className="uppercase"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {!billingSameAsShipping ? (
              <div className="space-y-2">
                <Label>Billing snapshot</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billing-name">Name</Label>
                    <Input
                      id="billing-name"
                      value={billing?.name ?? ""}
                      onChange={(e) =>
                        setBilling((b) =>
                          b ? { ...b, name: e.target.value } : b,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-email">Email (optional)</Label>
                    <Input
                      id="billing-email"
                      value={billing?.email ?? ""}
                      onChange={(e) =>
                        setBilling((b) =>
                          b
                            ? { ...b, email: e.target.value || undefined }
                            : b,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="billing-line1">Address line 1</Label>
                    <Input
                      id="billing-line1"
                      value={billing?.line1 ?? ""}
                      onChange={(e) =>
                        setBilling((b) =>
                          b ? { ...b, line1: e.target.value } : b,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="billing-line2">Address line 2 (optional)</Label>
                    <Input
                      id="billing-line2"
                      value={billing?.line2 ?? ""}
                      onChange={(e) =>
                        setBilling((b) =>
                          b ? { ...b, line2: e.target.value || undefined } : b,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-city">City</Label>
                    <Input
                      id="billing-city"
                      value={billing?.city ?? ""}
                      onChange={(e) =>
                        setBilling((b) =>
                          b ? { ...b, city: e.target.value } : b,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-state">State</Label>
                    <Input
                      id="billing-state"
                      value={billing?.state ?? ""}
                      onChange={(e) =>
                        setBilling((b) =>
                          b ? { ...b, state: e.target.value } : b,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-zip">PIN code</Label>
                    <Input
                      id="billing-zip"
                      value={billing?.zipCode ?? ""}
                      onChange={(e) =>
                        setBilling((b) =>
                          b
                            ? {
                                ...b,
                                zipCode: e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 6),
                              }
                            : b,
                        )
                      }
                      inputMode="numeric"
                      maxLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-country">Country</Label>
                    <Input
                      id="billing-country"
                      value={billing?.country ?? "IN"}
                      onChange={(e) =>
                        setBilling((b) =>
                          b ? { ...b, country: e.target.value } : b,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="billing-gstin">
                      GSTIN{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="billing-gstin"
                      value={billing?.gstin ?? ""}
                      onChange={(e) =>
                        setBilling((b) =>
                          b
                            ? {
                                ...b,
                                gstin:
                                  e.target.value
                                    .toUpperCase()
                                    .replace(/\s/g, "")
                                    .slice(0, 15) || undefined,
                              }
                            : b,
                        )
                      }
                      placeholder="15-character GSTIN"
                      className="uppercase"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={convertMutation.isPending}
                onClick={() => setConvertOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={convertMutation.isPending || !shipping}
              >
                {convertMutation.isPending ? "Creating…" : "Convert to order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
