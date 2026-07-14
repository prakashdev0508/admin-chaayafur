import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { BannerFormDialog } from "@/components/website/BannerFormDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  createBanner,
  getBanner,
  listBanners,
  updateBanner,
} from "@/services/home.service";
import type {
  AdminBanner,
  BannerType,
  CreateBannerPayload,
  UpdateBannerPayload,
} from "@/types/home";

type HomeBannerSectionProps = {
  type: BannerType;
  title: string;
  description: string;
  canCreate: boolean;
  canUpdate: boolean;
};

async function invalidateHomeQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.admin.banners.all });
  await queryClient.invalidateQueries({ queryKey: queryKeys.shop.home });
}

export function HomeBannerSection({
  type,
  title,
  description,
  canCreate,
  canUpdate,
}: HomeBannerSectionProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const listParams = useMemo(
    () => ({ type, page: 1, limit: 50 }),
    [type],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.admin.banners.list(listParams),
    queryFn: () => listBanners(listParams),
  });

  const banners = useMemo(
    () =>
      [...(data?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [data?.items],
  );

  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number | null;
      payload: CreateBannerPayload | UpdateBannerPayload;
    }) => {
      if (id != null) {
        return updateBanner(id, payload);
      }
      return createBanner(payload as CreateBannerPayload);
    },
    onSuccess: async (_result, variables) => {
      toast.success(variables.id != null ? "Banner updated" : "Banner created");
      await invalidateHomeQueries(queryClient);
      setDialogOpen(false);
      setEditing(null);
      setEditingId(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save banner",
      );
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      updateBanner(id, { isActive }),
    onSuccess: async (_result, variables) => {
      toast.success(variables.isActive ? "Banner activated" : "Banner deactivated");
      await invalidateHomeQueries(queryClient);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update banner",
      );
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({
      current,
      neighbor,
    }: {
      current: AdminBanner;
      neighbor: AdminBanner;
    }) => {
      await Promise.all([
        updateBanner(current.id, { sortOrder: neighbor.sortOrder }),
        updateBanner(neighbor.id, { sortOrder: current.sortOrder }),
      ]);
    },
    onSuccess: async () => {
      await invalidateHomeQueries(queryClient);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to reorder banners",
      );
    },
  });

  async function openEdit(banner: AdminBanner) {
    setLoadingEdit(true);
    setEditingId(banner.id);
    setDialogOpen(true);
    try {
      const detail = await getBanner(banner.id);
      setEditing(detail);
    } catch {
      setEditing(banner);
      toast.error("Could not load full banner details; editing from list data.");
    } finally {
      setLoadingEdit(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setEditingId(null);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditing(null);
      setEditingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1.5">{description}</CardDescription>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load banners"}
          </p>
        )}

        {isLoading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            No {type === "MAIN" ? "main" : "sub"} banners yet
            {canCreate && (
              <Button variant="link" className="mt-1" onClick={openCreate}>
                Add the first one
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className="w-[260px] shrink-0 overflow-hidden rounded-xl border bg-card"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title ?? "Banner"}
                    className="size-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <StatusBadge
                      variant={banner.isActive ? "success" : "neutral"}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  </div>
                </div>
                <div className="space-y-3 p-3">
                  <div>
                    <p className="truncate font-medium">
                      {banner.title || "Untitled banner"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {banner.redirectUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={
                            index === 0 || reorderMutation.isPending
                          }
                          aria-label="Move left"
                          onClick={() =>
                            reorderMutation.mutate({
                              current: banner,
                              neighbor: banners[index - 1],
                            })
                          }
                        >
                          <ChevronLeft className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={
                            index === banners.length - 1 ||
                            reorderMutation.isPending
                          }
                          aria-label="Move right"
                          onClick={() =>
                            reorderMutation.mutate({
                              current: banner,
                              neighbor: banners[index + 1],
                            })
                          }
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label="Edit banner"
                          onClick={() => void openEdit(banner)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "ml-auto h-7 px-2 text-xs",
                            banner.isActive && "text-destructive",
                          )}
                          disabled={toggleActiveMutation.isPending}
                          onClick={() => {
                            if (banner.isActive) {
                              if (
                                !window.confirm(
                                  `Deactivate "${banner.title || `banner #${banner.id}`}"?`,
                                )
                              ) {
                                return;
                              }
                            }
                            toggleActiveMutation.mutate({
                              id: banner.id,
                              isActive: !banner.isActive,
                            });
                          }}
                        >
                          {banner.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <BannerFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        initial={editing}
        defaultType={type}
        loading={saveMutation.isPending || loadingEdit}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync({
            id: editingId,
            payload,
          });
        }}
      />
    </Card>
  );
}
