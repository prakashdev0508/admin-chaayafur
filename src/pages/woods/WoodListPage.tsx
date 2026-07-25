import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, Trees } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { woodColumns } from "@/components/data-table/wood-columns";
import { EmptyState } from "@/components/shared/EmptyState";
import { queryKeys } from "@/lib/query-keys";
import { listWoods } from "@/services/woods.service";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";

export function WoodListPage() {
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [name, setName] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">(
    "all",
  );

  const params = {
    page: page + 1,
    limit: pageSize,
    ...(nameFilter ? { name: nameFilter } : {}),
    ...(activeFilter !== "all" ? { isActive: activeFilter === "true" } : {}),
  };

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.woods.list(params),
    queryFn: () => listWoods(params),
    enabled: hasPermission(PERMISSIONS.VIEW_PRODUCTS),
  });

  if (!hasPermission(PERMISSIONS.VIEW_PRODUCTS)) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Woods" description="Manage wood options for products." />
        <EmptyState
          icon={Trees}
          title="Access restricted"
          description="You do not have permission to view woods."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Woods"
        description="Global wood catalog for product wood selection."
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
            {hasPermission(PERMISSIONS.CREATE_PRODUCTS) && (
              <Button
                render={
                  <Link to="/woods/new">
                    <Plus className="size-4" />
                    New wood
                  </Link>
                }
              />
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1 space-y-1.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setNameFilter(name.trim());
                setPage(0);
              }
            }}
            placeholder="Search by name…"
          />
        </div>
        <Select
          value={activeFilter}
          onValueChange={(value) => {
            if (value === "all" || value === "true" || value === "false") {
              setActiveFilter(value);
              setPage(0);
            }
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setNameFilter(name.trim());
            setPage(0);
          }}
        >
          Search
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load woods"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={Trees}
          title="No woods yet"
          description="Create wood options like Sonic, Peak, or Engineering."
          action={
            hasPermission(PERMISSIONS.CREATE_PRODUCTS) ? (
              <Button render={<Link to="/woods/new">Create wood</Link>} />
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={woodColumns}
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
    </div>
  );
}
