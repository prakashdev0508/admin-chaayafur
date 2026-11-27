import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Newspaper, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { createMediaVendorColumns } from "@/components/data-table/media-columns";
import { MediaVendorFormDialog } from "@/components/media/MediaVendorFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermission } from "@/hooks/usePermission";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import {
  createMediaVendor,
  deleteMediaVendor,
  listMediaVendors,
  updateMediaVendor,
} from "@/services/media.service";
import type {
  CreateMediaVendorPayload,
  MediaVendor,
  UpdateMediaVendorPayload,
} from "@/types/media";

type StatusFilter = "all" | "active" | "hidden";

const STATUS_ITEMS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
];

function statusToParam(value: StatusFilter) {
  if (value === "active") return true;
  if (value === "hidden") return false;
  return undefined;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function MediaVendorsPanel() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.CREATE_MEDIA);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_MEDIA);
  const canDelete = hasPermission(PERMISSIONS.DELETE_MEDIA);
  const queryClient = useQueryClient();

  const [nameInput, setNameInput] = useState("");
  const debouncedName = useDebouncedValue(nameInput.trim(), 300);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MediaVendor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaVendor | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    setPage(0);
  }, [debouncedName, status]);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(debouncedName ? { name: debouncedName } : {}),
      ...(statusToParam(status) !== undefined
        ? { isActive: statusToParam(status) }
        : {}),
    }),
    [page, pageSize, debouncedName, status],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.admin.media.vendors.list(params),
    queryFn: () => listMediaVendors(params),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.media.all });

  const saveMutation = useMutation({
    mutationFn: (
      payload: CreateMediaVendorPayload | UpdateMediaVendorPayload,
    ) => {
      if (editing) return updateMediaVendor(editing.id, payload);
      return createMediaVendor(payload as CreateMediaVendorPayload);
    },
    onSuccess: () => {
      toast.success(editing ? "Vendor updated" : "Vendor created");
      setDialogOpen(false);
      setEditing(null);
      void invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save vendor");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (vendor: MediaVendor) =>
      updateMediaVendor(vendor.id, { isActive: !vendor.isActive }),
    onMutate: (vendor) => setPendingId(vendor.id),
    onSuccess: (_data, vendor) => {
      toast.success(vendor.isActive ? "Vendor hidden" : "Vendor shown");
      void invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update vendor");
    },
    onSettled: () => setPendingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMediaVendor(id),
    onSuccess: () => {
      toast.success("Vendor deleted");
      setPendingDelete(null);
      void invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete vendor");
    },
  });

  const columns = useMemo(
    () =>
      createMediaVendorColumns({
        canUpdate,
        canDelete,
        pendingId,
        onEdit: (vendor) => {
          setEditing(vendor);
          setDialogOpen(true);
        },
        onToggleActive: (vendor) => toggleMutation.mutate(vendor),
        onDelete: setPendingDelete,
      }),
    [canUpdate, canDelete, pendingId, toggleMutation],
  );

  const filtered = Boolean(debouncedName) || status !== "all";
  const isEmpty = !isLoading && (data?.items.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
          placeholder="Search by name"
          className="w-full max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            if (value === "all" || value === "active" || value === "hidden") {
              setStatus(value);
            }
          }}
          items={STATUS_ITEMS}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          aria-label="Refresh vendors"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
        {canCreate ? (
          <Button
            className="ml-auto"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add vendor
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load vendors"}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={Newspaper}
          title={filtered ? "No vendors match" : "No vendors yet"}
          description={
            filtered
              ? "Try a different name or status."
              : "Add a publication first, then attach coverage to it."
          }
          action={
            canCreate && !filtered ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                Add vendor
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
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

      <MediaVendorFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        initial={editing}
        loading={saveMutation.isPending}
        onSubmit={(payload) => saveMutation.mutateAsync(payload)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete vendor"
        description={
          pendingDelete
            ? `Delete ${pendingDelete.name}? This fails if coverage items are still attached. Hide the vendor instead if you only want it off the storefront.`
            : "Delete this vendor?"
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          return deleteMutation.mutateAsync(pendingDelete.id);
        }}
      />
    </div>
  );
}
