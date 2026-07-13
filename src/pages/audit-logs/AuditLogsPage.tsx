import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Loader2, RefreshCw, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { queryKeys } from "@/lib/query-keys";
import { listAuditLogs } from "@/services/audit-logs.service";
import { usePermission } from "@/hooks/usePermission";
import type { AuditEntityType } from "@/types/audit-log";
import { AUDIT_ENTITY_TYPE_ITEMS } from "@/lib/select-items";

type AuditFilters = {
  entityType: string;
  entityId: string;
  parentEntityId: string;
  changedById: string;
};

const defaultFilters: AuditFilters = {
  entityType: "all",
  entityId: "",
  parentEntityId: "",
  changedById: "",
};

export function AuditLogsPage() {
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [filters, setFilters] = useState<AuditFilters>(defaultFilters);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(filters.entityType !== "all"
        ? { entityType: filters.entityType as AuditEntityType }
        : {}),
      ...(filters.entityId.trim()
        ? { entityId: Number(filters.entityId) }
        : {}),
      ...(filters.parentEntityId.trim()
        ? { parentEntityId: Number(filters.parentEntityId) }
        : {}),
      ...(filters.changedById.trim()
        ? { changedById: Number(filters.changedById) }
        : {}),
    }),
    [page, pageSize, filters],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: () => listAuditLogs(params),
    enabled: hasPermission("view-orders"),
  });

  const activeCount = [
    filters.entityType !== "all",
    filters.entityId.trim(),
    filters.parentEntityId.trim(),
    filters.changedById.trim(),
  ].filter(Boolean).length;

  if (!hasPermission("view-orders")) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Audit logs" description="Staff change history." />
        <EmptyState
          icon={ScrollText}
          title="Access restricted"
          description="You do not have permission to view audit logs."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Audit logs"
        description="Field-level history of staff changes across the system."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline">
                    <Filter className="size-4" />
                    Filters
                    {activeCount > 0 && (
                      <span className="ml-1 rounded-md bg-primary/10 px-1.5 text-xs text-primary">
                        {activeCount}
                      </span>
                    )}
                  </Button>
                }
              />
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter audit logs</SheetTitle>
                  <SheetDescription>
                    Narrow by entity type, IDs, or staff user.
                  </SheetDescription>
                </SheetHeader>
                <form
                  className="flex flex-1 flex-col gap-4 px-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    setFilters({
                      entityType: String(form.get("entityType") ?? "all"),
                      entityId: String(form.get("entityId") ?? ""),
                      parentEntityId: String(form.get("parentEntityId") ?? ""),
                      changedById: String(form.get("changedById") ?? ""),
                    });
                    setPage(0);
                  }}
                >
                  <div className="space-y-2">
                    <Label>Entity type</Label>
                    <Select name="entityType" defaultValue={filters.entityType} items={AUDIT_ENTITY_TYPE_ITEMS}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                        <SelectItem value="ADDRESS">Address</SelectItem>
                        <SelectItem value="ORDER">Order</SelectItem>
                        <SelectItem value="ORDER_ITEM">Order item</SelectItem>
                        <SelectItem value="PAYMENT">Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entityId">Entity ID</Label>
                    <Input
                      id="entityId"
                      name="entityId"
                      defaultValue={filters.entityId}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentEntityId">Parent entity ID</Label>
                    <Input
                      id="parentEntityId"
                      name="parentEntityId"
                      defaultValue={filters.parentEntityId}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="changedById">Changed by (staff ID)</Label>
                    <Input
                      id="changedById"
                      name="changedById"
                      defaultValue={filters.changedById}
                    />
                  </div>
                  <SheetFooter className="mt-auto">
                    <Button type="submit">Apply filters</Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load audit logs"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <AuditLogTable logs={data?.items ?? []} />
          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.meta.total} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center text-sm">
                  Page {page + 1} of {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
