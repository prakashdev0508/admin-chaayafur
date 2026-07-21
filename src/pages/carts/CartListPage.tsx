import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { CartFilterSheet } from "@/components/carts/CartFilterSheet";
import { adminCartColumns } from "@/components/data-table/admin-cart-columns";
import { DataTable } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProductSearchSelect } from "@/components/shared/ProductSearchSelect";
import { Button } from "@/components/ui/button";
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
import {
  countActiveCartFilters,
  defaultCartFilters,
  type CartFilters,
} from "@/lib/cart-filters";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { listAdminCarts, seedAdminCart } from "@/services/admin-carts.service";
import type { ProductListItem } from "@/types/product";

export function CartListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_CUSTOMERS);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_CUSTOMERS);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<CartFilters>(defaultCartFilters);
  const [seedOpen, setSeedOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(
    null,
  );
  const [quantity, setQuantity] = useState("1");

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(filters.customerPhone.trim()
        ? { customerPhone: filters.customerPhone.trim() }
        : {}),
      ...(filters.customerId.trim()
        ? { customerId: Number(filters.customerId) }
        : {}),
      ...(filters.hasItems === "true"
        ? { hasItems: true }
        : filters.hasItems === "false"
          ? { hasItems: false }
          : {}),
    }),
    [page, pageSize, filters],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.carts.list(params),
    queryFn: () => listAdminCarts(params),
    enabled: canView,
  });

  const seedMutation = useMutation({
    mutationFn: seedAdminCart,
    onSuccess: (cart) => {
      toast.success("Cart updated");
      setSeedOpen(false);
      setCustomerId("");
      setSelectedProduct(null);
      setQuantity("1");
      void queryClient.invalidateQueries({ queryKey: queryKeys.carts.all });
      navigate(`/carts/${cart.id}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update cart");
    },
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Carts"
          description="Inspect and edit customer carts."
        />
        <EmptyState
          icon={ShoppingBag}
          title="Access restricted"
          description="You do not have permission to view carts."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Carts"
        description="Staff view of server-side customer carts."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <CartFilterSheet
              filters={filters}
              activeCount={countActiveCartFilters(filters)}
              onApply={(next) => {
                setFilters(next);
                setPage(0);
              }}
            />
            {canUpdate && (
              <Button onClick={() => setSeedOpen(true)}>
                <Plus className="size-4" />
                Add to cart
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load carts"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={adminCartColumns}
          data={data?.items ?? []}
          manualPagination
          pageIndex={page}
          pageSize={pageSize}
          pageCount={data?.meta.totalPages ?? 1}
          totalRows={data?.meta.total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      )}

      <Dialog
        open={seedOpen}
        onOpenChange={(open) => {
          setSeedOpen(open);
          if (!open) {
            setCustomerId("");
            setSelectedProduct(null);
            setQuantity("1");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add item to customer cart</DialogTitle>
            <DialogDescription>
              Creates the cart if needed, then upserts the product line.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const cid = Number(customerId);
              const qty = Number(quantity);
              if (!Number.isFinite(cid) || cid < 1) {
                toast.error("Enter a valid customer ID");
                return;
              }
              if (!selectedProduct) {
                toast.error("Select a product");
                return;
              }
              if (!Number.isFinite(qty) || qty < 1) {
                toast.error("Quantity must be at least 1");
                return;
              }
              seedMutation.mutate({
                customerId: cid,
                productId: selectedProduct.id,
                quantity: qty,
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="seed-customer">Customer ID</Label>
              <Input
                id="seed-customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              />
            </div>
            <ProductSearchSelect
              value={selectedProduct}
              onChange={setSelectedProduct}
              disabled={seedMutation.isPending}
            />
            <div className="space-y-2">
              <Label htmlFor="seed-qty">Quantity</Label>
              <Input
                id="seed-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
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
    </div>
  );
}
