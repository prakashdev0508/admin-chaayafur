import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, FileSpreadsheet, Loader2, Plus, RefreshCw, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { createProductColumns } from "@/components/data-table/product-columns";
import { ProductActiveFilters } from "@/components/products/ProductActiveFilters";
import { ProductBulkUploadDialog } from "@/components/products/ProductBulkUploadDialog";
import {
  ProductFilterSheet,
  defaultProductFilters,
  type ProductFilters,
} from "@/components/products/ProductFilterSheet";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api";
import { getStockStatus } from "@/lib/product-utils";
import { fetchCategoriesTree } from "@/services/categories.service";
import { listProducts, updateProduct } from "@/services/products.service";
import type { CategoryTreeItem } from "@/types/category";
import type {
  ListProductsParams,
  ProductListItem,
  ProductMerchandisingTag,
  ProductSortBy,
  SortOrder,
} from "@/types/product";
import { PERMISSIONS } from "@/lib/roles";

const VISIBILITY_VALUES = new Set(["all", "active", "inactive"]);
const STOCK_VALUES = new Set(["all", "in_stock", "low_stock", "out_of_stock"]);
const SORT_BY_VALUES = new Set<ProductSortBy>(["createdAt", "name", "price"]);
const SORT_ORDER_VALUES = new Set<SortOrder>(["asc", "desc"]);
const TAG_VALUES = new Set<ProductMerchandisingTag | "all">([
  "all",
  "isBestSeller",
  "isFeaturedProduct",
  "isMostPopular",
  "isNewArrival",
]);

function filtersFromSearchParams(searchParams: URLSearchParams): ProductFilters {
  const activeParam = searchParams.get("active");
  const stockParam = searchParams.get("stock");
  const tagParam = searchParams.get("tag");
  const sortByParam = searchParams.get("sortBy");
  const sortOrderParam = searchParams.get("sortOrder");
  const subCategoryId = searchParams.get("subCategoryId");

  return {
    name: searchParams.get("name") ?? defaultProductFilters.name,
    minPrice: searchParams.get("minPrice") ?? defaultProductFilters.minPrice,
    maxPrice: searchParams.get("maxPrice") ?? defaultProductFilters.maxPrice,
    category: searchParams.get("category") ?? defaultProductFilters.category,
    subCategoryId:
      subCategoryId && /^\d+$/.test(subCategoryId)
        ? subCategoryId
        : defaultProductFilters.subCategoryId,
    active:
      activeParam && VISIBILITY_VALUES.has(activeParam)
        ? activeParam
        : defaultProductFilters.active,
    stock:
      stockParam && STOCK_VALUES.has(stockParam)
        ? stockParam
        : defaultProductFilters.stock,
    tag:
      tagParam && TAG_VALUES.has(tagParam as ProductMerchandisingTag | "all")
        ? (tagParam as ProductFilters["tag"])
        : defaultProductFilters.tag,
    sortBy:
      sortByParam && SORT_BY_VALUES.has(sortByParam as ProductSortBy)
        ? (sortByParam as ProductSortBy)
        : defaultProductFilters.sortBy,
    sortOrder:
      sortOrderParam && SORT_ORDER_VALUES.has(sortOrderParam as SortOrder)
        ? (sortOrderParam as SortOrder)
        : defaultProductFilters.sortOrder,
  };
}

function paginationFromSearchParams(searchParams: URLSearchParams) {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const limitRaw = Number(searchParams.get("limit") ?? "10");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const limit =
    Number.isFinite(limitRaw) && limitRaw >= 1 && limitRaw <= 100
      ? limitRaw
      : 10;
  return { pageIndex: page - 1, pageSize: limit };
}

/** Only non-default filter values + pagination (when not first page / default size). */
function searchParamsFromState(
  filters: ProductFilters,
  pageIndex: number,
  pageSize: number,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.name.trim()) params.set("name", filters.name.trim());
  if (filters.minPrice.trim()) params.set("minPrice", filters.minPrice.trim());
  if (filters.maxPrice.trim()) params.set("maxPrice", filters.maxPrice.trim());
  if (filters.category !== defaultProductFilters.category) {
    params.set("category", filters.category);
  }
  if (filters.subCategoryId !== defaultProductFilters.subCategoryId) {
    params.set("subCategoryId", filters.subCategoryId);
  }
  if (filters.active !== defaultProductFilters.active) {
    params.set("active", filters.active);
  }
  if (filters.stock !== defaultProductFilters.stock) {
    params.set("stock", filters.stock);
  }
  if (filters.tag !== defaultProductFilters.tag) {
    params.set("tag", filters.tag);
  }
  if (filters.sortBy !== defaultProductFilters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }
  if (filters.sortOrder !== defaultProductFilters.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }
  if (pageIndex > 0) params.set("page", String(pageIndex + 1));
  if (pageSize !== 10) params.set("limit", String(pageSize));

  return params;
}

function countActiveFilters(filters: ProductFilters) {
  return Object.entries(filters).filter(([key, value]) => {
    const defaultValue = defaultProductFilters[key as keyof ProductFilters];
    if (typeof value === "string") {
      return value.trim() !== String(defaultValue).trim();
    }
    return value !== defaultValue;
  }).length;
}

function applyStockFilter(
  products: ProductListItem[],
  stockFilter: string,
): ProductListItem[] {
  if (stockFilter === "all") return products;
  return products.filter(
    (product) => getStockStatus(product) === stockFilter,
  );
}

function sortProducts(
  items: ProductListItem[],
  sortBy: ProductFilters["sortBy"],
  sortOrder: ProductFilters["sortOrder"],
) {
  const dir = sortOrder === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
    if (sortBy === "price") {
      return (parseFloat(a.price) - parseFloat(b.price)) * dir;
    }
    return (
      (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
    );
  });
}

function mergeAndSortProducts(
  items: ProductListItem[],
  sortBy: ProductFilters["sortBy"],
  sortOrder: ProductFilters["sortOrder"],
) {
  const byId = new Map<number, ProductListItem>();
  items.forEach((item) => byId.set(item.id, item));
  return sortProducts(Array.from(byId.values()), sortBy, sortOrder);
}

function buildBaseParams(
  filters: ProductFilters,
  categoryId?: number,
): Omit<ListProductsParams, "page" | "limit" | "isActive"> {
  const params: Omit<ListProductsParams, "page" | "limit" | "isActive"> = {
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  if (filters.name.trim()) {
    params.name = filters.name.trim();
  }

  if (filters.minPrice.trim()) {
    params.minPrice = parseFloat(filters.minPrice);
  }

  if (filters.maxPrice.trim()) {
    params.maxPrice = parseFloat(filters.maxPrice);
  }

  if (filters.subCategoryId !== "all") {
    params.subCategoryId = Number(filters.subCategoryId);
  } else if (categoryId) {
    params.categoryId = categoryId;
  }

  if (filters.tag !== "all") {
    params.tag = filters.tag;
  }

  return params;
}

function removeFilter(
  filters: ProductFilters,
  key: keyof ProductFilters,
): ProductFilters {
  const next = { ...filters, [key]: defaultProductFilters[key] };
  if (key === "category") {
    next.subCategoryId = "all";
  }
  return next;
}

export function ProductListPage() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.CREATE_PRODUCTS);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_PRODUCTS);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(() =>
    filtersFromSearchParams(searchParams),
  );
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(() =>
    filtersFromSearchParams(searchParams),
  );

  const initialPagination = paginationFromSearchParams(searchParams);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categoriesTree, setCategoriesTree] = useState<CategoryTreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [pageIndex, setPageIndex] = useState(initialPagination.pageIndex);
  const [pageSize, setPageSize] = useState(initialPagination.pageSize);
  const [pageCount, setPageCount] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const syncUrl = useCallback(
    (filters: ProductFilters, nextPageIndex: number, nextPageSize: number) => {
      setSearchParams(
        searchParamsFromState(filters, nextPageIndex, nextPageSize),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const categoryId = useMemo(() => {
    if (appliedFilters.category === "all") return undefined;
    return categoriesTree.find((c) => c.slug === appliedFilters.category)?.id;
  }, [appliedFilters.category, categoriesTree]);

  const isCategoryFilterReady =
    appliedFilters.category === "all" || categoryId !== undefined;

  const fetchProducts = useCallback(async () => {
    if (!isCategoryFilterReady) return;

    setIsLoading(true);
    setError(null);

    try {
      const baseParams = buildBaseParams(appliedFilters, categoryId);
      const pagination = { page: pageIndex + 1, limit: pageSize };

      if (appliedFilters.active === "all") {
        const [activeRes, inactiveRes] = await Promise.all([
          listProducts({ ...baseParams, ...pagination, isActive: true }),
          listProducts({ ...baseParams, ...pagination, isActive: false }),
        ]);

        const merged = mergeAndSortProducts(
          [...activeRes.items, ...inactiveRes.items],
          appliedFilters.sortBy,
          appliedFilters.sortOrder,
        );
        const filtered = applyStockFilter(merged, appliedFilters.stock);
        const total = activeRes.meta.total + inactiveRes.meta.total;

        setProducts(filtered);
        setTotalRows(total);
        setPageCount(Math.max(1, Math.ceil(total / pageSize)));
      } else {
        const isActive = appliedFilters.active === "active";
        const response = await listProducts({
          ...baseParams,
          ...pagination,
          isActive,
        });

        const filtered = applyStockFilter(response.items, appliedFilters.stock);
        setProducts(filtered);
        setPageCount(response.meta.totalPages);
        setTotalRows(response.meta.total);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load products",
      );
      setProducts([]);
      setPageCount(1);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    appliedFilters,
    categoryId,
    isCategoryFilterReady,
    pageIndex,
    pageSize,
  ]);

  useEffect(() => {
    fetchCategoriesTree()
      .then(setCategoriesTree)
      .catch(() => setCategoriesTree([]));
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts, refreshKey]);

  const columns = useMemo(
    () =>
      createProductColumns({
        canUpdate,
        onDeactivate: async (product) => {
          if (
            !window.confirm(
              `Deactivate "${product.name}"? It will be hidden from the storefront.`,
            )
          ) {
            return;
          }
          try {
            await updateProduct(product.id, { isActive: false });
            setRefreshKey((k) => k + 1);
          } catch (err) {
            window.alert(
              err instanceof ApiError ? err.message : "Failed to deactivate product",
            );
          }
        },
      }),
    [canUpdate],
  );

  const activeFilterCount = countActiveFilters(appliedFilters);

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPageIndex(0);
    syncUrl(draftFilters, 0, pageSize);
    setFilterOpen(false);
  };

  const handleClear = () => {
    setDraftFilters(defaultProductFilters);
    setAppliedFilters(defaultProductFilters);
    setPageIndex(0);
    syncUrl(defaultProductFilters, 0, pageSize);
    setFilterOpen(false);
  };

  const handleRemoveFilter = (key: keyof ProductFilters) => {
    const next = removeFilter(appliedFilters, key);
    setAppliedFilters(next);
    setPageIndex(0);
    syncUrl(next, 0, pageSize);
  };

  const handlePageChange = (nextPage: number) => {
    setPageIndex(nextPage);
    syncUrl(appliedFilters, nextPage, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
    syncUrl(appliedFilters, 0, size);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Products"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={isLoading}
            >
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={openFilters}
            >
              <Filter className="size-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  render={
                    <Link to="/products/bulk-prepare">
                      <FileSpreadsheet className="size-4" />
                      Prepare import
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  onClick={() => setBulkUploadOpen(true)}
                >
                  <Upload className="size-4" />
                  Bulk upload
                </Button>
                <Button
                  render={
                    <Link to="/products/new">
                      <Plus className="size-4" />
                      Add product
                    </Link>
                  }
                />
              </>
            )}
          </div>
        }
      />

      <ProductActiveFilters
        filters={appliedFilters}
        categoriesTree={categoriesTree}
        onRemove={handleRemoveFilter}
        onClearAll={handleClear}
      />

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading products...
            </div>
          </div>
        )}

        {isLoading && products.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-md border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading products...
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={products}
            pageSize={pageSize}
            manualPagination
            pageCount={pageCount}
            pageIndex={pageIndex}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            totalRows={totalRows}
          />
        )}
      </div>

      <ProductFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={handleApply}
        onClear={handleClear}
      />

      {canCreate && (
        <ProductBulkUploadDialog
          open={bulkUploadOpen}
          onOpenChange={setBulkUploadOpen}
          onImportSuccess={(result) => {
            if (result.successCount > 0) {
              setRefreshKey((k) => k + 1);
            }
          }}
        />
      )}
    </div>
  );
}
