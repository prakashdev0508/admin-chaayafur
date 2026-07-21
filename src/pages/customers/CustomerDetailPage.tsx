import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Plus,
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
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProductSearchSelect } from "@/components/shared/ProductSearchSelect";
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
import { usePermission } from "@/hooks/usePermission";
import type {
  CreateAddressPayload,
  CustomerAddress,
} from "@/types/address";
import type { ProductListItem } from "@/types/product";
import { PERMISSIONS } from "@/lib/roles";

export function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PERMISSIONS.UPDATE_CUSTOMERS);

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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={formatPhone(customer.phone)}
        description={`Customer #${customer.id}`}
        action={
          <div className="flex gap-2">
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

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-4 py-5 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="mt-0.5 font-medium">{formatPhone(customer.phone)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-0.5">
              <StatusBadge variant={customer.isActive ? "success" : "danger"}>
                {customer.isActive ? "Active" : "Blocked"}
              </StatusBadge>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last login</p>
            <p className="mt-0.5">
              {customer.lastLogin ? formatDate(customer.lastLogin) : "Never"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="mt-0.5 font-medium">{customer.orderCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reviews</p>
            <p className="mt-0.5 font-medium">{customer.reviewCount}</p>
          </div>
          {customer.cart && (
            <div>
              <p className="text-xs text-muted-foreground">Cart subtotal</p>
              <p className="mt-0.5 font-medium">
                {formatCurrency(customer.cart.subtotalAmount)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="cart">
        <TabsList>
          <TabsTrigger value="cart">Cart</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="cart" className="mt-4">
          {!customer.cart ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="size-4" />
                  No server cart
                </CardTitle>
                <CardDescription>
                  This customer has not created a cart yet. You can seed one by
                  adding a product.
                </CardDescription>
              </CardHeader>
              {canEdit && (
                <CardContent>
                  <Button onClick={() => setSeedOpen(true)}>
                    <Plus className="size-4" />
                    Add first item
                  </Button>
                </CardContent>
              )}
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Cart #{customer.cart.id}</CardTitle>
                  <CardDescription>
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
              <CardContent>
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

        <TabsContent value="addresses" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Up to 5 addresses per customer. Contact details belong to each
            address, not the account phone.
          </p>

          {canEdit &&
            !showAddressForm &&
            !editingAddress &&
            customer.addresses.length < 5 && (
              <Button
                variant="outline"
                onClick={() => setShowAddressForm(true)}
              >
                <Plus className="size-4" />
                Add address
              </Button>
            )}

          {(showAddressForm || editingAddress) && canEdit && (
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
          )}

          {customer.addresses.length === 0 && !showAddressForm ? (
            <p className="text-sm text-muted-foreground">
              No addresses on file.
            </p>
          ) : (
            <div className="space-y-3">
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
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          {hasPermission(PERMISSIONS.VIEW_ORDERS) ? (
            <DataTable
              columns={customerOrderColumns}
              data={ordersQuery.data?.items ?? customer.recentOrders}
              pageSize={10}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              You do not have permission to view orders.
            </p>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <AuditLogTable
            logs={auditQuery.data?.items ?? []}
            loading={auditQuery.isLoading}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={seedOpen}
        onOpenChange={(open) => {
          setSeedOpen(open);
          if (!open) {
            setSelectedProduct(null);
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
              });
            }}
          >
            <ProductSearchSelect
              value={selectedProduct}
              onChange={setSelectedProduct}
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
