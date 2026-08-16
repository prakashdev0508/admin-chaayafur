import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Plus, RefreshCw } from "lucide-react";
import { quotationColumns } from "@/components/data-table/quotation-columns";
import { DataTable } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermission } from "@/hooks/usePermission";
import { QUOTATION_STATUS_ITEMS } from "@/lib/quotation";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { listQuotations } from "@/services/quotations.service";
import type { QuotationStatus } from "@/types/quotation";

const STATUS_FILTER_ITEMS = [
  { value: "all", label: "All statuses" },
  ...QUOTATION_STATUS_ITEMS,
];

export function QuotationListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status !== "all" ? { status: status as QuotationStatus } : {}),
    }),
    [page, pageSize, search, status],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.quotations.list(params),
    queryFn: () => listQuotations(params),
    enabled: hasPermission(PERMISSIONS.VIEW_QUOTATIONS),
  });

  if (!hasPermission(PERMISSIONS.VIEW_QUOTATIONS)) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Quotations"
          description="Staff quotes for walk-in and outbound customers."
        />
        <EmptyState
          icon={FileText}
          title="Access restricted"
          description="You do not have permission to view quotations."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Quotations"
        description="Create, send, and follow up on customer quotations."
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
            {hasPermission(PERMISSIONS.CREATE_QUOTATIONS) && (
              <Button
                render={
                  <Link to="/quotations/new">
                    <Plus className="size-4" />
                    New quotation
                  </Link>
                }
              />
            )}
          </div>
        }
      />

      <form
        className="flex flex-wrap items-end gap-4 rounded-lg border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(searchInput);
          setPage(0);
        }}
      >
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label htmlFor="quotation-search">Search</Label>
          <Input
            id="quotation-search"
            placeholder="Number, name, mobile, or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              if (!value) return;
              setStatus(value);
              setPage(0);
            }}
            items={STATUS_FILTER_ITEMS}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Search</Button>
        {(search || status !== "all") && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setStatus("all");
              setPage(0);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load quotations"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotations yet"
          description="Create a quotation, generate the PDF, and save it for follow-up."
          action={
            hasPermission(PERMISSIONS.CREATE_QUOTATIONS) ? (
              <Button
                render={<Link to="/quotations/new">Create quotation</Link>}
              />
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={quotationColumns}
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
          onRowClick={(row) => navigate(`/quotations/${row.id}`)}
        />
      )}
    </div>
  );
}
