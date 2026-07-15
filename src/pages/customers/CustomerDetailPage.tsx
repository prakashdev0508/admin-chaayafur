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
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { formatDate, formatPhone } from "@/lib/format";
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
import { listCustomerAuditLogs } from "@/services/audit-logs.service";
import { usePermission } from "@/hooks/usePermission";
import type {
  CreateAddressPayload,
  CustomerAddress,
} from "@/types/address";
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
    queryClient.invalidateQueries({
      queryKey: queryKeys.customers.detail(customerId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.customers.auditLogs(customerId),
    });
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
        description={`Customer since ${customer.orderCount} orders`}
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile</CardTitle>
              <StatusBadge variant={customer.isActive ? "success" : "danger"}>
                {customer.isActive ? "Active" : "Blocked"}
              </StatusBadge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{formatPhone(customer.phone)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last login</p>
              <p>
                {customer.lastLogin ? formatDate(customer.lastLogin) : "Never"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Orders</p>
              <p>{customer.orderCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reviews</p>
              <p>{customer.reviewCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="addresses">
              <TabsList>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

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
                    data={
                      ordersQuery.data?.items ??
                      customer.recentOrders
                    }
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
          </CardContent>
        </Card>
      </div>

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
