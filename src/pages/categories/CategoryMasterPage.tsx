import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FolderTree,
  ImageIcon,
  Layers,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { SubCategoryFormDialog } from "@/components/categories/SubCategoryFormDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/ui/status-badge";
import { queryKeys } from "@/lib/query-keys";
import {
  createCategory,
  createSubCategory,
  fetchAdminCategoriesTree,
  updateCategory,
  updateSubCategory,
} from "@/services/categories.service";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import type {
  Category,
  CategoryTreeItem,
  CreateCategoryPayload,
  CreateSubCategoryPayload,
  SubCategoryTreeItem,
  UpdateCategoryPayload,
  UpdateSubCategoryPayload,
} from "@/types/category";
import { PERMISSIONS } from "@/lib/roles";

export function CategoryMasterPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_CATEGORIES);
  const canCreate = hasPermission(PERMISSIONS.CREATE_CATEGORIES);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_CATEGORIES);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    category?: Category;
  }>({ open: false });
  const [subDialog, setSubDialog] = useState<{
    open: boolean;
    sub?: SubCategoryTreeItem;
    categoryId?: number;
  }>({ open: false });

  const { data: tree, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.categories.adminTree,
    queryFn: fetchAdminCategoriesTree,
    enabled: canView,
  });

  const categories = useMemo(() => tree ?? [], [tree]);

  const filterQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!filterQuery) {
      return categories.map((category) => ({
        category,
        matchedByCategory: true,
        matchedSubs: [] as SubCategoryTreeItem[],
      }));
    }

    return categories.flatMap((category) => {
      const matchedByCategory =
        category.name.toLowerCase().includes(filterQuery) ||
        category.slug.toLowerCase().includes(filterQuery);
      const matchedSubs = category.subCategories.filter(
        (sub) =>
          sub.name.toLowerCase().includes(filterQuery) ||
          sub.slug.toLowerCase().includes(filterQuery) ||
          (sub.heading?.toLowerCase().includes(filterQuery) ?? false),
      );
      if (!matchedByCategory && matchedSubs.length === 0) return [];
      return [{ category, matchedByCategory, matchedSubs }];
    });
  }, [categories, filterQuery]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (
      selectedId === null ||
      !filtered.some((entry) => entry.category.id === selectedId)
    ) {
      setSelectedId(filtered[0].category.id);
    }
  }, [filtered, selectedId]);

  const selectedEntry = useMemo(
    () => filtered.find((entry) => entry.category.id === selectedId) ?? null,
    [filtered, selectedId],
  );
  const selected = selectedEntry?.category ?? null;

  const visibleSubs = useMemo(() => {
    if (!selected) return [];
    if (!filterQuery || !selectedEntry) return selected.subCategories;
    // Category name hit → show all subs; sub-only hit → show matching subs
    if (selectedEntry.matchedByCategory) return selected.subCategories;
    return selectedEntry.matchedSubs;
  }, [selected, selectedEntry, filterQuery]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });

  const categoryMutation = useMutation({
    mutationFn: async (payload: {
      id?: number;
      data: CreateCategoryPayload | UpdateCategoryPayload;
    }) => {
      if (payload.id) {
        return updateCategory(payload.id, payload.data);
      }
      return createCategory(payload.data as CreateCategoryPayload);
    },
    onSuccess: async (saved, variables) => {
      queryClient.setQueryData<CategoryTreeItem[]>(
        queryKeys.categories.adminTree,
        (old) => {
          const current = old ?? [];
          if (variables.id) {
            return current.map((category) =>
              category.id === variables.id
                ? { ...category, ...saved }
                : category,
            );
          }
          return [
            ...current,
            {
              ...saved,
              isActive: saved.isActive ?? true,
              subCategories: [],
            },
          ];
        },
      );
      if (!variables.id) {
        setSelectedId(saved.id);
      }
      await invalidate();
      toast.success("Category saved");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to save category",
      );
    },
  });

  const subMutation = useMutation({
    mutationFn: async (payload: {
      id?: number;
      data: CreateSubCategoryPayload | UpdateSubCategoryPayload;
    }) => {
      if (payload.id) {
        return updateSubCategory(payload.id, payload.data);
      }
      return createSubCategory(payload.data as CreateSubCategoryPayload);
    },
    onSuccess: async (saved, variables) => {
      const resolvedImageUrl =
        saved.imageUrl ??
        saved.image?.url ??
        variables.data.image?.url;

      queryClient.setQueryData<CategoryTreeItem[]>(
        queryKeys.categories.adminTree,
        (old) => {
          const current = old ?? [];
          if (variables.id) {
            return current.map((category) => ({
              ...category,
              subCategories: category.subCategories.map((sub) =>
                sub.id === variables.id
                  ? {
                      ...sub,
                      name: saved.name,
                      slug: saved.slug,
                      heading: saved.heading,
                      description: saved.description ?? null,
                      isActive: saved.isActive,
                      imageUrl: resolvedImageUrl ?? sub.imageUrl ?? null,
                    }
                  : sub,
              ),
            }));
          }

          const createPayload = variables.data as CreateSubCategoryPayload;
          const newSub: SubCategoryTreeItem = {
            id: saved.id,
            name: saved.name,
            slug: saved.slug,
            heading: saved.heading,
            description: saved.description ?? null,
            categoryId: saved.categoryId,
            productsCount: saved.productsCount ?? 0,
            isActive: saved.isActive ?? true,
            imageUrl: resolvedImageUrl ?? null,
          };

          return current.map((category) =>
            category.id === createPayload.categoryId
              ? {
                  ...category,
                  subCategories: [...category.subCategories, newSub],
                }
              : category,
          );
        },
      );
      await invalidate();
      toast.success("Sub-category saved");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to save sub-category",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: number;
      isActive: boolean;
    }) => updateCategory(id, { isActive }),
    onSuccess: async (_saved, variables) => {
      queryClient.setQueryData<CategoryTreeItem[]>(
        queryKeys.categories.adminTree,
        (old) =>
          (old ?? []).map((category) =>
            category.id === variables.id
              ? { ...category, isActive: variables.isActive }
              : category,
          ),
      );
      await invalidate();
      toast.success(
        variables.isActive ? "Category marked active" : "Category marked inactive",
      );
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category",
      );
    },
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Categories"
          description="Manage top-level categories and sub-categories."
        />
        <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed bg-muted/20">
          <EmptyState
            icon={FolderTree}
            title="Access restricted"
            description="You do not have permission to view categories."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] flex-col gap-4 md:h-[calc(100dvh-3.5rem)]">
      <PageHeader
        title="Categories"
        description="Pick a category to preview its imagery and manage its sub-categories."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh categories"
            >
              <RefreshCw
                className={cn("size-4", isFetching && "animate-spin")}
              />
            </Button>
            {canCreate ? (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCategoryDialog({ open: true, category: undefined })
                  }
                >
                  <Plus className="size-4" />
                  Add category
                </Button>
                <Button
                  onClick={() =>
                    setSubDialog({
                      open: true,
                      categoryId: selected?.id,
                    })
                  }
                  disabled={categories.length === 0}
                >
                  <Plus className="size-4" />
                  Add sub-category
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load categories"}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed bg-muted/20">
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Create your first top-level category to organise products."
            action={
              canCreate ? (
                <Button
                  onClick={() =>
                    setCategoryDialog({ open: true, category: undefined })
                  }
                >
                  Add category
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-none bg-card">
          <div className="shrink-0 border-b p-3">
            <div className="relative max-w-full">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter categories & sub-categories…"
                className="h-9 pl-8"
                aria-label="Filter categories and sub-categories"
              />
            </div>
          </div>

          {filtered.length === 0 && filterQuery ? (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/15 p-8">
              <EmptyState
                icon={Search}
                title="No matches found"
                description={`Nothing matched “${query.trim()}”. Try another category or sub-category name.`}
                action={
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear filter
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <aside className="flex w-full shrink-0 flex-col border-b lg:h-full lg:w-80 lg:border-b-0 lg:border-r lg:overflow-hidden">
                <div className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain lg:p-2">
                  {filtered.map(({ category, matchedSubs }) => {
                    const active = category.id === selectedId;
                    const isInactive = category.isActive === false;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedId(category.id)}
                        className={cn(
                          "flex min-w-52 shrink-0 flex-col gap-2 rounded-lg border p-2 text-left transition lg:w-full lg:min-w-0 lg:border-transparent",
                          active
                            ? "border-foreground/15 bg-muted/80 lg:border-transparent"
                            : "border-border/60 bg-background hover:bg-muted/40 lg:border-transparent",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                            {category.imageUrl ? (
                              <img
                                src={category.imageUrl}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-muted-foreground/50">
                                <ImageIcon className="size-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="min-w-0 truncate text-sm leading-tight font-medium">
                                {category.name}
                              </p>
                              <StatusBadge
                                variant={isInactive ? "warning" : "success"}
                                className="h-5 shrink-0 px-1.5 text-[10px] leading-none"
                              >
                                {isInactive ? "Inactive" : "Active"}
                              </StatusBadge>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-[11px] text-muted-foreground">
                                {category.subCategories.length} sub
                                {category.subCategories.length === 1 ? "" : "s"}
                              </p>
                              {category.isSignatureCollection ? (
                                <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-white px-2 text-[10px] font-medium text-foreground ring-1 ring-border">
                                  Signature
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {matchedSubs.length > 0 ? (
                          <ul className="space-y-1 border-t border-border/50 pt-2 pl-1">
                            {matchedSubs.map((sub) => (
                              <li
                                key={sub.id}
                                className="truncate text-[11px] text-muted-foreground"
                              >
                                <span className="text-foreground/80">
                                  {sub.name}
                                </span>
                                <span className="font-mono"> · /{sub.slug}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
                {!selected ? (
                  <div className="flex h-full min-h-64 items-center justify-center p-8">
                    <EmptyState
                      icon={FolderTree}
                      title="Select a category"
                      description="Choose a category from the list to view its image and sub-categories."
                    />
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="relative aspect-16/7 w-full bg-muted">
                      {selected.imageUrl ? (
                        <img
                          src={selected.imageUrl}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <ImageIcon className="size-10 opacity-40" />
                          <p className="text-sm">No category image</p>
                        </div>
                      )}
                      {selected.isSignatureCollection ? (
                        <span className="absolute top-3 right-3 z-10 inline-flex h-7 items-center rounded-full bg-white px-3 text-xs font-medium text-foreground shadow-sm">
                          Signature
                        </span>
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 via-black/20 to-transparent px-5 pt-16 pb-4">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div className="min-w-0 text-white">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                                {selected.name}
                              </h2>
                              <StatusBadge
                                variant={
                                  selected.isActive === false
                                    ? "warning"
                                    : "success"
                                }
                              >
                                {selected.isActive === false
                                  ? "Inactive"
                                  : "Active"}
                              </StatusBadge>
                            </div>
                            <p className="mt-1 font-mono text-xs text-white/70">
                              /{selected.slug}
                            </p>
                          </div>
                          {canUpdate ? (
                            <div className="flex shrink-0 gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/95 text-foreground hover:bg-white"
                                onClick={() =>
                                  setCategoryDialog({
                                    open: true,
                                    category: selected,
                                  })
                                }
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/95 text-foreground hover:bg-white"
                                disabled={statusMutation.isPending}
                                onClick={() =>
                                  statusMutation.mutate({
                                    id: selected.id,
                                    isActive: selected.isActive === false,
                                  })
                                }
                              >
                                {selected.isActive === false
                                  ? "Mark active"
                                  : "Mark inactive"}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-6 p-5 sm:p-6">
                      {selected.description ? (
                        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                          {selected.description}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Layers className="size-3.5" />
                          {selected.subCategories.length} sub-categor
                          {selected.subCategories.length === 1 ? "y" : "ies"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Package className="size-3.5" />
                          {selected.subCategories.reduce(
                            (sum, s) => sum + (s.productsCount ?? 0),
                            0,
                          )}{" "}
                          products
                        </span>
                      </div>

                      <Separator />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold tracking-tight">
                            Sub-categories
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {filterQuery &&
                            selectedEntry &&
                            !selectedEntry.matchedByCategory &&
                            selectedEntry.matchedSubs.length > 0
                              ? `Showing ${visibleSubs.length} match${visibleSubs.length === 1 ? "" : "es"} under ${selected.name}`
                              : `Nested under ${selected.name}`}
                          </p>
                        </div>
                        {canCreate ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              setSubDialog({
                                open: true,
                                categoryId: selected.id,
                              })
                            }
                          >
                            <Plus className="size-3.5" />
                            Add sub-category
                          </Button>
                        ) : null}
                      </div>

                      {visibleSubs.length === 0 ? (
                        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10">
                          <EmptyState
                            icon={Layers}
                            title={
                              selected.subCategories.length === 0
                                ? "No sub-categories yet"
                                : "No matching sub-categories"
                            }
                            description={
                              selected.subCategories.length === 0
                                ? "Add one to start grouping products under this category."
                                : "Clear the filter to see all sub-categories in this group."
                            }
                            className="py-2"
                            action={
                              selected.subCategories.length === 0 && canCreate ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setSubDialog({
                                      open: true,
                                      categoryId: selected.id,
                                    })
                                  }
                                >
                                  <Plus className="size-3.5" />
                                  Add sub-category
                                </Button>
                              ) : selected.subCategories.length > 0 ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setQuery("")}
                                >
                                  Clear filter
                                </Button>
                              ) : undefined
                            }
                          />
                        </div>
                      ) : (
                        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {visibleSubs.map((sub) => (
                            <li
                              key={sub.id}
                              className={cn(
                                "overflow-hidden rounded-xl border bg-background transition",
                                sub.isActive === false && "opacity-60",
                              )}
                            >
                              <div className="relative aspect-4/3 bg-muted">
                                {sub.imageUrl ? (
                                  <img
                                    src={sub.imageUrl}
                                    alt=""
                                    className="absolute inset-0 size-full object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/60">
                                    <ImageIcon className="size-7" />
                                    <span className="text-xs">No image</span>
                                  </div>
                                )}
                                <div className="absolute top-2.5 left-2.5">
                                  <StatusBadge
                                    variant={
                                      sub.isActive === false
                                        ? "warning"
                                        : "success"
                                    }
                                    className="bg-background/95 shadow-sm"
                                  >
                                    {sub.isActive === false
                                      ? "Inactive"
                                      : "Active"}
                                  </StatusBadge>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 p-3.5">
                                <div className="min-w-0">
                                  <p className="truncate leading-tight font-medium">
                                    {sub.name}
                                  </p>
                                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                                    /{sub.slug}
                                  </p>
                                  {sub.heading ? (
                                    <p className="mt-1.5 line-clamp-1 text-sm text-muted-foreground">
                                      {sub.heading}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex items-center justify-between gap-2 border-t pt-3">
                                  <span className="text-sm text-muted-foreground tabular-nums">
                                    {sub.productsCount ?? 0} products
                                  </span>
                                  {canUpdate ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setSubDialog({ open: true, sub })
                                      }
                                    >
                                      <Pencil className="size-3.5" />
                                      Edit
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      <CategoryFormDialog
        open={categoryDialog.open}
        onOpenChange={(open) =>
          setCategoryDialog((prev) => ({
            open,
            category: open ? prev.category : undefined,
          }))
        }
        initial={categoryDialog.category}
        loading={categoryMutation.isPending}
        onSubmit={(data) =>
          categoryMutation.mutateAsync({
            id: categoryDialog.category?.id,
            data,
          })
        }
      />

      <SubCategoryFormDialog
        open={subDialog.open}
        onOpenChange={(open) =>
          setSubDialog((prev) => ({
            open,
            sub: open ? prev.sub : undefined,
            categoryId: open ? prev.categoryId : undefined,
          }))
        }
        categories={categories}
        initial={subDialog.sub}
        defaultCategoryId={subDialog.categoryId}
        loading={subMutation.isPending}
        onSubmit={(data) =>
          subMutation.mutateAsync({
            id: subDialog.sub?.id,
            data,
          })
        }
      />
    </div>
  );
}
