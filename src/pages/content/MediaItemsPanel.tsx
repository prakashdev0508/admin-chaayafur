import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Newspaper, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { createMediaItemColumns } from "@/components/data-table/media-columns";
import { MediaItemFormDialog } from "@/components/media/MediaItemFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
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
  createMediaItem,
  deleteMediaItem,
  listMediaItems,
  listMediaVendors,
  updateMediaItem,
} from "@/services/media.service";
import type {
  CreateMediaItemPayload,
  MediaItem,
  MediaItemVendor,
  UpdateMediaItemPayload,
} from "@/types/media";

type StatusFilter = "all" | "active" | "hidden";
type HomeFilter = "all" | "home" | "off";

const STATUS_ITEMS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
];

const HOME_ITEMS = [
  { value: "all", label: "All home" },
  { value: "home", label: "On home" },
  { value: "off", label: "Off home" },
];

function statusToParam(value: StatusFilter) {
  if (value === "active") return true;
  if (value === "hidden") return false;
  return undefined;
}

function homeToParam(value: HomeFilter) {
  if (value === "home") return true;
  if (value === "off") return false;
  return undefined;
}

export function MediaItemsPanel() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.CREATE_MEDIA);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_MEDIA);
  const canDelete = hasPermission(PERMISSIONS.DELETE_MEDIA);
  const queryClient = useQueryClient();

  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [homeFilter, setHomeFilter] = useState<HomeFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    setPage(0);
  }, [vendorFilter, status, homeFilter]);

  const vendorOptionsQuery = useQuery({
    queryKey: queryKeys.admin.media.vendors.list({
      page: 1,
      limit: 100,
      purpose: "options",
    }),
    queryFn: () => listMediaVendors({ page: 1, limit: 100 }),
  });

  const vendors: MediaItemVendor[] = useMemo(
    () =>
      (vendorOptionsQuery.data?.items ?? []).map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        imageUrl: vendor.imageUrl,
      })),
    [vendorOptionsQuery.data?.items],
  );

  const vendorFilterItems = useMemo(
    () => [
      { value: "all", label: "All vendors" },
      ...vendors.map((vendor) => ({
        value: String(vendor.id),
        label: vendor.name,
      })),
    ],
    [vendors],
  );

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(vendorFilter !== "all" ? { vendorId: Number(vendorFilter) } : {}),
      ...(statusToParam(status) !== undefined
        ? { isActive: statusToParam(status) }
        : {}),
      ...(homeToParam(homeFilter) !== undefined
        ? { showOnHome: homeToParam(homeFilter) }
        : {}),
    }),
    [page, pageSize, vendorFilter, status, homeFilter],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.admin.media.items.list(params),
    queryFn: () => listMediaItems(params),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.media.all });

  const saveMutation = useMutation({
    mutationFn: (payload: CreateMediaItemPayload | UpdateMediaItemPayload) => {
      if (editing) return updateMediaItem(editing.id, payload);
      return createMediaItem(payload as CreateMediaItemPayload);
    },
    onSuccess: () => {
      toast.success(editing ? "Coverage updated" : "Coverage created");
      setDialogOpen(false);
      setEditing(null);
      void invalidate();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to save coverage",
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (item: MediaItem) =>
      updateMediaItem(item.id, { isActive: !item.isActive }),
    onMutate: (item) => setPendingId(item.id),
    onSuccess: (_data, item) => {
      toast.success(item.isActive ? "Coverage hidden" : "Coverage shown");
      void invalidate();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update coverage",
      );
    },
    onSettled: () => setPendingId(null),
  });

  const homeMutation = useMutation({
    mutationFn: (item: MediaItem) =>
      updateMediaItem(item.id, { showOnHome: !item.showOnHome }),
    onMutate: (item) => setPendingId(item.id),
    onSuccess: (_data, item) => {
      toast.success(
        item.showOnHome ? "Removed from home" : "Added to home",
      );
      void invalidate();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update home flag",
      );
    },
    onSettled: () => setPendingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMediaItem(id),
    onSuccess: () => {
      toast.success("Coverage deleted");
      setPendingDelete(null);
      void invalidate();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete coverage",
      );
    },
  });

  const columns = useMemo(
    () =>
      createMediaItemColumns({
        canUpdate,
        canDelete,
        pendingId,
        onEdit: (item) => {
          setEditing(item);
          setDialogOpen(true);
        },
        onToggleActive: (item) => toggleMutation.mutate(item),
        onToggleHome: (item) => homeMutation.mutate(item),
        onDelete: setPendingDelete,
      }),
    [canUpdate, canDelete, pendingId, toggleMutation, homeMutation],
  );

  const filtered =
    vendorFilter !== "all" || status !== "all" || homeFilter !== "all";
  const isEmpty = !isLoading && (data?.items.length ?? 0) === 0;
  const vendorsLoaded = vendorOptionsQuery.isSuccess;
  const hasVendors = vendors.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={vendorFilter}
          onValueChange={(value) => {
            if (value) setVendorFilter(value);
          }}
          items={vendorFilterItems}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All vendors" />
          </SelectTrigger>
          <SelectContent>
            {vendorFilterItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select
          value={homeFilter}
          onValueChange={(value) => {
            if (value === "all" || value === "home" || value === "off") {
              setHomeFilter(value);
            }
          }}
          items={HOME_ITEMS}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOME_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          aria-label="Refresh coverage"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
        {canCreate && hasVendors ? (
          <Button
            className="ml-auto"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add coverage
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load coverage"}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={Newspaper}
          title={
            filtered
              ? "No coverage matches"
              : vendorsLoaded && !hasVendors
                ? "Add a vendor first"
                : "No coverage yet"
          }
          description={
            filtered
              ? "Try another vendor, status, or home filter."
              : vendorsLoaded && !hasVendors
                ? "Coverage belongs to a vendor. Create one on the Vendors tab."
                : "Add a story with a link, cover, and description."
          }
          action={
            canCreate && hasVendors && !filtered ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                Add coverage
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

      <MediaItemFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        initial={editing}
        vendors={vendors}
        loading={saveMutation.isPending}
        onSubmit={(payload) => saveMutation.mutateAsync(payload)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete coverage"
        description="This permanently removes the item and its cover image."
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
