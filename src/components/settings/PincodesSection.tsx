import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { queryKeys } from "@/lib/query-keys";
import {
  deleteShippingPincode,
  listShippingPincodes,
  upsertShippingPincodes,
} from "@/services/shipping.service";

type PincodesSectionProps = {
  canUpdate: boolean;
};

const serviceableFilterItems = [
  { value: "all", label: "All" },
  { value: "true", label: "Serviceable" },
  { value: "false", label: "Not serviceable" },
];

function parsePincodeList(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(/[\s,;]+/)) {
    const pincode = part.trim();
    if (!pincode || seen.has(pincode)) continue;
    seen.add(pincode);
    result.push(pincode);
  }
  return result;
}

export function PincodesSection({ canUpdate }: PincodesSectionProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [serviceableFilter, setServiceableFilter] = useState("all");
  const [bulkPincodes, setBulkPincodes] = useState("");
  const [bulkServiceable, setBulkServiceable] = useState(true);

  const listParams = useMemo(() => {
    const params: {
      page: number;
      limit: number;
      search?: string;
      isServiceable?: boolean;
    } = { page, limit: 20 };
    if (search) params.search = search;
    if (serviceableFilter === "true") params.isServiceable = true;
    if (serviceableFilter === "false") params.isServiceable = false;
    return params;
  }, [page, search, serviceableFilter]);

  const listQuery = useQuery({
    queryKey: queryKeys.admin.shippingPincodes.list(listParams),
    queryFn: () => listShippingPincodes(listParams),
  });

  const upsertMutation = useMutation({
    mutationFn: upsertShippingPincodes,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.shippingPincodes.all,
      });
      setBulkPincodes("");
      toast.success("Pincodes saved");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save pincodes",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShippingPincode,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.shippingPincodes.all,
      });
      toast.success("Pincode removed");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete pincode",
      );
    },
  });

  function handleUpsert() {
    const pincodes = parsePincodeList(bulkPincodes);
    if (pincodes.length === 0) {
      toast.error("Enter at least one pincode");
      return;
    }
    const invalid = pincodes.find((p) => !/^\d{6}$/.test(p));
    if (invalid) {
      toast.error(`Invalid pincode: ${invalid}. Use 6-digit codes.`);
      return;
    }
    upsertMutation.mutate({ pincodes, isServiceable: bulkServiceable });
  }

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const isEmptyTable = !listQuery.isLoading && meta?.total === 0 && !search;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Serviceable pincodes</CardTitle>
          <CardDescription>
            When this list is empty, all valid 6-digit Indian pincodes are
            serviceable. Adding rows restricts delivery to those marked
            serviceable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canUpdate && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-pincodes">Add or update pincodes</Label>
                <Textarea
                  id="bulk-pincodes"
                  value={bulkPincodes}
                  onChange={(e) => setBulkPincodes(e.target.value)}
                  placeholder="560001, 560002&#10;400001"
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="bulk-serviceable"
                    checked={bulkServiceable}
                    onCheckedChange={setBulkServiceable}
                  />
                  <Label htmlFor="bulk-serviceable">Mark as serviceable</Label>
                </div>
                <Button
                  onClick={handleUpsert}
                  disabled={upsertMutation.isPending}
                >
                  {upsertMutation.isPending ? "Saving..." : "Upsert pincodes"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor="pincode-search">Search</Label>
              <div className="flex gap-2">
                <Input
                  id="pincode-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search pincode"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearch(searchInput.trim());
                      setPage(1);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch(searchInput.trim());
                    setPage(1);
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
            <div className="w-44 space-y-2">
              <Label>Status</Label>
              <Select
                value={serviceableFilter}
                onValueChange={(value) => {
                  if (!value) return;
                  setServiceableFilter(value);
                  setPage(1);
                }}
                items={serviceableFilterItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceableFilterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {listQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : isEmptyTable ? (
            <EmptyState
              icon={MapPin}
              title="No pincode restrictions"
              description="All valid Indian pincodes are currently serviceable. Add pincodes to build an allowlist."
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No matches"
              description="Try a different search or filter."
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pincode</TableHead>
                      <TableHead>Serviceable</TableHead>
                      {canUpdate && (
                        <TableHead className="w-16 text-right"> </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row) => (
                      <TableRow key={row.pincode}>
                        <TableCell className="font-mono">
                          {row.pincode}
                        </TableCell>
                        <TableCell>
                          {row.isServiceable ? "Yes" : "No"}
                        </TableCell>
                        {canUpdate && (
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `Remove pincode ${row.pincode} from the list?`,
                                  )
                                ) {
                                  return;
                                }
                                deleteMutation.mutate(row.pincode);
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Page {meta.page} of {meta.totalPages} ({meta.total} total)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
