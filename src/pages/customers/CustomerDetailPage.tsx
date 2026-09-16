import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  MapPin,
  NotebookPen,
  Plus,
  ScrollText,
  ShieldBan,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { AdminCartItemsPanel } from "@/components/carts/AdminCartItemsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table/data-table";
import { customerOrderColumns } from "@/components/data-table/customer-order-columns";
import { AddressForm } from "@/components/customers/AddressForm";
import { AddressCard } from "@/components/customers/AddressCard";
import { CustomerFollowUpsTab } from "@/components/customers/CustomerFollowUpsTab";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProductSearchSelect } from "@/components/shared/ProductSearchSelect";
import { ProductCartMaterialPickers } from "@/components/shared/ProductCartMaterialPickers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import {
  blockCustomer,
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomer,
  listCustomerOrders,
  unblockCustomer,
  updateCustomerAddress,
} from "@/services/customers.service";
import { seedAdminCart } from "@/services/admin-carts.service";
import { listCustomerAuditLogs } from "@/services/audit-logs.service";
// import { getAdminWallet } from "@/services/wallets.service";
import { usePermission } from "@/hooks/usePermission";
import type {
  CreateAddressPayload,
  CustomerAddress,
} from "@/types/address";
import type { ProductListItem } from "@/types/product";
import {
  customizationPicksFromSelection,
  type CustomizationSelection,
} from "@/lib/product-customization";
import { PERMISSIONS } from "@/lib/roles";

const tabTriggerClass =
  "min-h-11 shrink-0 gap-2 rounded-none px-3 py-3 after:bottom-0 data-active:after:h-0.5 sm:px-4";

const CUSTOMER_TABS = [
  "cart",
  "addresses",
  "orders",
  "follow-ups",
  "activity",
] as const;

type CustomerTab = (typeof CUSTOMER_TABS)[number];

function isCustomerTab(value: string | null): value is CustomerTab {
  return (
    value != null && (CUSTOMER_TABS as readonly string[]).includes(value)
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PERMISSIONS.UPDATE_CUSTOMERS);
  // Wallet tab temporarily disabled
  // const canViewWallet = hasPermission(PERMISSIONS.VIEW_WALLETS);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null,
  );
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null);
  const [seedOpen, setSeedOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(
    null,
  );
  const [seedQty, setSeedQty] = useState("1");
  const [customizationSelection, setCustomizationSelection] =
    useState<CustomizationSelection>({});

  const tabParam = searchParams.get("tab");
  const activeTab: CustomerTab = isCustomerTab(tabParam) ? tabParam : "cart";

  const setActiveTab = (value: string) => {
    if (!isCustomerTab(value)) return;
    const next = new URLSearchParams(searchParams);
    if (value === "cart") {
      next.delete("tab");
    } else {
      next.set("tab", value);
    }
    setSearchParams(next, { replace: true });
  };

  const customerQuery = useQuery({
    queryKey: queryKeys.customers.detail(customerId),
    queryFn: () => getCustomer(customerId),
    enabled: Number.isFinite(customerId),
  });

  const ordersQuery = useQuery({
    queryKey: queryKeys.customers.orders(customerId),
    queryFn: () => listCustomerOrders(customerId, { limit: 20 }),
    enabled: Number.isFinite(customerId) && hasPermission(PERMISSIONS.VIEW_ORDERS),
  });

  const auditQuery = useQuery({
    queryKey: queryKeys.customers.auditLogs(customerId),
    queryFn: () => listCustomerAuditLogs(customerId, { limit: 50 }),
    enabled: Number.isFinite(customerId),
  });

  // Wallet API temporarily disabled
  // const walletQuery = useQuery({
  //   queryKey: queryKeys.wallets.detail(customerId),
  //   queryFn: () => getAdminWallet(customerId),
  //   enabled: Number.isFinite(customerId) && canViewWallet,
  // });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.customers.detail(customerId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.customers.auditLogs(customerId),
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.carts.all });
  };

  const blockMutation = useMutation({
    mutationFn: () =>
      customerQuery.data?.isActive
        ? blockCustomer(customerId)
        : unblockCustomer(customerId),
    onSuccess: () => {
      invalidate();
      toast.success(
        customerQuery.data?.isActive
          ? "Customer blocked"
          : "Customer unblocked",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Action failed",
      );
    },
  });

  const addressMutation = useMutation({
    mutationFn: async (payload: {
      addressId?: number;
      data: CreateAddressPayload;
    }) => {
      if (payload.addressId) {
        return updateCustomerAddress(
          customerId,
          payload.addressId,
          payload.data,
        );
      }
      return createCustomerAddress(customerId, payload.data);
    },
    onSuccess: () => {
      invalidate();
      setShowAddressForm(false);
      setEditingAddress(null);
      toast.success("Address saved");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save address",
      );
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: number) =>
      deleteCustomerAddress(customerId, addressId),
    onSuccess: () => {
      invalidate();
      setDeleteAddressId(null);
      toast.success("Address deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete address",
      );
    },
  });

  const seedMutation = useMutation({
    mutationFn: seedAdminCart,
    onSuccess: () => {
      toast.success("Cart created");
      setSeedOpen(false);
      setSelectedProduct(null);
      setCustomizationSelection({});
      setSeedQty("1");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create cart",
      );
    },
  });

  const customer = customerQuery.data;

  if (customerQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Customer not found" />
        <Button variant="outline" render={<Link to="/customers">Back</Link>} />
      </div>
    );
  }

  const stats = [
    {
      label: "Orders",
      value: String(customer.orderCount),
      hint: "Lifetime orders",
    },
    {
      label: "Reviews",
      value: String(customer.reviewCount),
      hint: "Product reviews",
    },
    {
      label: "Addresses",
      value: String(customer.addresses.length),
      hint: "Saved on file",
    },
    {
      label: "Cart",
      value: customer.cart
        ? formatCurrency(customer.cart.subtotalAmount)
        : "—",
      hint: customer.cart
        ? `${customer.cart.itemCount} item${customer.cart.itemCount === 1 ? "" : "s"}`
        : "No server cart",
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title={formatPhone(customer.phone)}
        description={`Customer #${customer.id} · Last login ${
          customer.lastLogin ? formatDate(customer.lastLogin) : "never"
        }`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={
                <Link to="/customers">
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              }
            />
            {canEdit && (
              <Button
                variant={customer.isActive ? "destructive" : "default"}
                onClick={() => setConfirmBlock(true)}
              >
                {customer.isActive ? (
                  <>
                    <ShieldBan className="size-4" />
                    Block
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Unblock
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />

      <Card className="overflow-hidden border-foreground/10 shadow-xs">
        <CardContent className="grid gap-0 p-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-foreground px-4 py-3 text-background sm:border-b-0 sm:border-r">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold tracking-tight">
                {formatPhone(customer.phone)}
              </p>
              <p className="mt-0.5 text-xs text-background/65">
                #{customer.id}
                {" · "}
                {customer.lastLogin
                  ? `Last login ${formatDate(customer.lastLogin)}`
                  : "Never logged in"}
              </p>
            </div>
            <StatusBadge
              variant={customer.isActive ? "success" : "danger"}
              className="shrink-0"
            >
              {customer.isActive ? "Active" : "Blocked"}
            </StatusBadge>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col justify-center gap-0.5 bg-background px-3 py-2.5 sm:px-4"
              >
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-semibold tracking-tight tabular-nums">
                  {stat.value}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {stat.hint}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="gap-4 sm:gap-6"
      >
        <TabsList
          variant="line"
          className="h-auto w-full flex-nowrap justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <TabsTrigger value="cart" className={tabTriggerClass}>
            <ShoppingBag className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Cart</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className={tabTriggerClass}>
            <MapPin className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Addresses</span>
            {customer.addresses.length > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground max-sm:hidden">
                {customer.addresses.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className={tabTriggerClass}>
            <ClipboardList className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="follow-ups" className={tabTriggerClass}>
            <NotebookPen className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Follow-ups</span>
          </TabsTrigger>
          {/* Wallet tab temporarily disabled
          {canViewWallet && (
            <TabsTrigger value="wallet" className={tabTriggerClass}>
              Wallet
            </TabsTrigger>
          )}
          */}
          <TabsTrigger value="activity" className={tabTriggerClass}>
            <ScrollText className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cart" className="mt-0">
          {!customer.cart ? (
            <Card className="overflow-hidden shadow-xs">
              <EmptyState
                icon={ShoppingBag}
                title="No server cart"
                description="This customer has not created a cart yet. Seed one by adding the first product."
                action={
                  canEdit ? (
                    <Button onClick={() => setSeedOpen(true)}>
                      <Plus className="size-4" />
                      Add first item
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <Card className="overflow-hidden shadow-xs">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b bg-muted/20 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShoppingBag className="size-4 text-muted-foreground" />
                    Cart #{customer.cart.id}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {customer.cart.itemCount} item
                    {customer.cart.itemCount === 1 ? "" : "s"} ·{" "}
                    {formatCurrency(customer.cart.subtotalAmount)}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link to={`/carts/${customer.cart.id}`}>Open cart</Link>
                    }
                  />
                  {canEdit && (
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                      <Plus className="size-4" />
                      Add / update item
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <AdminCartItemsPanel
                  cart={customer.cart}
                  canUpdate={canEdit}
                  showAddButton={false}
                  addOpen={addOpen}
                  onAddOpenChange={setAddOpen}
                  extraInvalidateKeys={[
                    queryKeys.customers.detail(customerId),
                    queryKeys.customers.auditLogs(customerId),
                  ]}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="addresses" className="mt-0 space-y-4">
          <Card className="overflow-hidden shadow-xs">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b bg-muted/20 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="size-4 text-muted-foreground" />
                  Addresses
                </CardTitle>
                <CardDescription className="mt-1">
                  Up to 5 addresses. Contact details live on each address, not
                  the account phone.
                </CardDescription>
              </div>
              {canEdit &&
                !showAddressForm &&
                !editingAddress &&
                customer.addresses.length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <Plus className="size-4" />
                    Add address
                  </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {(showAddressForm || editingAddress) && canEdit && (
                <div className="rounded-xl border bg-muted/10 p-4">
                  <AddressForm
                    initial={editingAddress ?? undefined}
                    loading={addressMutation.isPending}
                    onCancel={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }}
                    onSubmit={(data) =>
                      addressMutation.mutateAsync({
                        addressId: editingAddress?.id,
                        data: data as CreateAddressPayload,
                      })
                    }
                  />
                </div>
              )}

              {customer.addresses.length === 0 && !showAddressForm ? (
                <EmptyState
                  icon={MapPin}
                  title="No addresses on file"
                  description="Add a shipping or billing address for this customer."
                  className="py-8"
                  action={
                    canEdit ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowAddressForm(true)}
                      >
                        <Plus className="size-4" />
                        Add address
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {customer.addresses.map((addr) => (
                    <AddressCard
                      key={addr.id}
                      address={addr}
                      canEdit={canEdit}
                      onEdit={() => {
                        setEditingAddress(addr);
                        setShowAddressForm(false);
                      }}
                      onDelete={() => setDeleteAddressId(addr.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <Card className="overflow-hidden shadow-xs">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4 text-muted-foreground" />
                Orders
              </CardTitle>
              <CardDescription className="mt-1">
                Recent and paginated order history for this customer.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {hasPermission(PERMISSIONS.VIEW_ORDERS) ? (
                (ordersQuery.data?.items ?? customer.recentOrders).length ===
                0 ? (
                  <EmptyState
                    icon={ClipboardList}
                    title="No orders yet"
                    description="Orders placed by this customer will show up here."
                    className="py-8"
                  />
                ) : (
                  <DataTable
                    columns={customerOrderColumns}
                    data={ordersQuery.data?.items ?? customer.recentOrders}
                    pageSize={10}
                  />
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  You do not have permission to view orders.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follow-ups" className="mt-0">
          <CustomerFollowUpsTab
            customerId={customerId}
            canEdit={canEdit}
            enabled={activeTab === "follow-ups"}
          />
        </TabsContent>

        {/* Wallet section temporarily disabled
        {canViewWallet && (
          <TabsContent value="wallet" className="mt-0">
            <Card className="overflow-hidden shadow-xs">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b bg-muted/20 pb-4">
                <div>
                  <CardTitle>Referral wallet</CardTitle>
                  <CardDescription className="mt-1">
                    Credits from delivered referral orders.
                  </CardDescription>
                </div>
                <Link
                  to={`/wallet-withdrawals?customerId=${customerId}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  View withdrawals
                </Link>
              </CardHeader>
              <CardContent className="pt-5">
                {walletQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : walletQuery.isError ? (
                  <p className="text-sm text-destructive">
                    {walletQuery.error instanceof Error
                      ? walletQuery.error.message
                      : "Failed to load wallet"}
                  </p>
                ) : walletQuery.data ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="mt-1 text-lg font-medium">
                        {formatCurrency(walletQuery.data.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Available
                      </p>
                      <p className="mt-1 text-lg font-medium">
                        {formatCurrency(walletQuery.data.availableBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="mt-1 text-lg font-medium">
                        {formatCurrency(walletQuery.data.pendingBalance)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No wallet data for this customer.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        */}

        <TabsContent value="activity" className="mt-0">
          <Card className="overflow-hidden shadow-xs">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText className="size-4 text-muted-foreground" />
                Activity
              </CardTitle>
              <CardDescription className="mt-1">
                Field-level audit history for this account and its addresses.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <AuditLogTable
                logs={auditQuery.data?.items ?? []}
                loading={auditQuery.isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={seedOpen}
        onOpenChange={(open) => {
          setSeedOpen(open);
          if (!open) {
            setSelectedProduct(null);
            setCustomizationSelection({});
            setSeedQty("1");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create cart</DialogTitle>
            <DialogDescription>
              Add the first product to create this customer&apos;s server cart.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedProduct) {
                toast.error("Select a product");
                return;
              }
              const qty = Number(seedQty);
              if (!Number.isFinite(qty) || qty < 1) {
                toast.error("Quantity must be at least 1");
                return;
              }
              seedMutation.mutate({
                customerId,
                productId: selectedProduct.id,
                quantity: qty,
                ...(customizationPicksFromSelection(customizationSelection)
                  .length > 0
                  ? {
                      customization: customizationPicksFromSelection(
                        customizationSelection,
                      ),
                    }
                  : {}),
              });
            }}
          >
            <ProductSearchSelect
              value={selectedProduct}
              onChange={(product) => {
                setSelectedProduct(product);
                setCustomizationSelection({});
              }}
              disabled={seedMutation.isPending}
            />
            <ProductCartMaterialPickers
              productId={selectedProduct?.id ?? null}
              customizationSelection={customizationSelection}
              onCustomizationChange={setCustomizationSelection}
              disabled={seedMutation.isPending}
            />
            <div className="space-y-2">
              <Label htmlFor="customer-seed-qty">Quantity</Label>
              <Input
                id="customer-seed-qty"
                type="number"
                min={1}
                value={seedQty}
                onChange={(e) => setSeedQty(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSeedOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={seedMutation.isPending}>
                {seedMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmBlock}
        onOpenChange={setConfirmBlock}
        title={customer.isActive ? "Block customer?" : "Unblock customer?"}
        description={
          customer.isActive
            ? "Blocked customers cannot log in via OTP."
            : "This customer will be able to log in again."
        }
        confirmLabel={customer.isActive ? "Block" : "Unblock"}
        variant={customer.isActive ? "destructive" : "default"}
        loading={blockMutation.isPending}
        onConfirm={() => blockMutation.mutateAsync()}
      />

      <ConfirmDialog
        open={deleteAddressId !== null}
        onOpenChange={(open) => !open && setDeleteAddressId(null)}
        title="Delete address?"
        description="This cannot be undone. Deletion fails if the address is linked to an active order."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteAddressMutation.isPending}
        onConfirm={() =>
          deleteAddressId !== null
            ? deleteAddressMutation.mutateAsync(deleteAddressId)
            : Promise.resolve()
        }
      />
    </div>
  );
}
