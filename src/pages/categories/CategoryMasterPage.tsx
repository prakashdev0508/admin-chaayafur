import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type {
  Category,
  CategoryTreeItem,
  CreateCategoryPayload,
  CreateSubCategoryPayload,
  SubCategoryTreeItem,
  UpdateCategoryPayload,
  UpdateSubCategoryPayload,
} from "@/types/category";

export function CategoryMasterPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canView = hasPermission("view-categories");
  const canCreate = hasPermission("create-categories");
  const canUpdate = hasPermission("update-categories");

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
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
          return [...current, { ...saved, isActive: saved.isActive ?? true, subCategories: [] }];
        },
      );
      await invalidate();
      toast.success("Category saved");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save category");
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
      if (!variables.id) {
        const createPayload = variables.data as CreateSubCategoryPayload;
        setExpanded((prev) => ({
          ...prev,
          [createPayload.categoryId]: true,
        }));
      }

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

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Categories"
          description="Manage top-level categories and sub-categories."
        />
        <EmptyState
          icon={FolderTree}
          title="Access restricted"
          description="You do not have permission to view categories."
        />
      </div>
    );
  }

  const categories = tree ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Categories"
        description="Master catalogue for top-level categories and product sub-categories. Inactive items are hidden from the storefront."
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
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCategoryDialog({ open: true, category: undefined })}
                >
                  <Plus className="size-4" />
                  Add category
                </Button>
                <Button
                  onClick={() => setSubDialog({ open: true })}
                  disabled={categories.length === 0}
                >
                  <Plus className="size-4" />
                  Add sub-category
                </Button>
              </>
            )}
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load categories"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create your first top-level category to organise products."
          action={
            canCreate ? (
              <Button onClick={() => setCategoryDialog({ open: true, category: undefined })}>
                Add category
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              expanded={expanded[category.id] !== false}
              onToggle={() => toggleExpanded(category.id)}
              canCreate={canCreate}
              canUpdate={canUpdate}
              onEditCategory={() =>
                setCategoryDialog({ open: true, category })
              }
              onAddSub={() =>
                setSubDialog({ open: true, categoryId: category.id })
              }
              onEditSub={(sub) => setSubDialog({ open: true, sub })}
            />
          ))}
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

type CategorySectionProps = {
  category: CategoryTreeItem;
  expanded: boolean;
  onToggle: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  onEditCategory: () => void;
  onAddSub: () => void;
  onEditSub: (sub: SubCategoryTreeItem) => void;
};

function CategorySection({
  category,
  expanded,
  onToggle,
  canCreate,
  canUpdate,
  onEditCategory,
  onAddSub,
  onEditSub,
}: CategorySectionProps) {
  return (
    <Card className={category.isActive === false ? "opacity-75" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            className="flex flex-1 items-start gap-2 text-left"
            onClick={onToggle}
          >
            {expanded ? (
              <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{category.name}</CardTitle>
                {category.isActive === false && (
                  <StatusBadge variant="neutral">Inactive</StatusBadge>
                )}
              </div>
              <CardDescription className="mt-1">
                <span className="font-mono text-xs">{category.slug}</span>
                {category.description ? ` · ${category.description}` : ""}
              </CardDescription>
            </div>
          </button>
          <div className="flex shrink-0 gap-1">
            {canUpdate && (
              <Button variant="ghost" size="sm" onClick={onEditCategory}>
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
            {canCreate && (
              <Button variant="outline" size="sm" onClick={onAddSub}>
                <Plus className="size-4" />
                Sub-category
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {category.subCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sub-categories in this group.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Heading</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    {canUpdate && <TableHead className="w-20" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.subCategories.map((sub) => (
                    <TableRow
                      key={sub.id}
                      className={sub.isActive === false ? "opacity-60" : undefined}
                    >
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {sub.slug}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.heading ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          variant={sub.isActive === false ? "neutral" : "success"}
                        >
                          {sub.isActive === false ? "Inactive" : "Active"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        {sub.productsCount ?? 0}
                      </TableCell>
                      {canUpdate && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onEditSub(sub)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
