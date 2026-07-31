import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  defaultUploadJobFilters,
  type UploadJobFilters,
} from "@/lib/upload-job-filters";
import {
  uploadJobStatusLabels,
  uploadJobTypeLabels,
} from "@/lib/upload-job-status";
import type { UploadJobStatus, UploadJobType } from "@/types/upload-job";

type UploadJobFilterSheetProps = {
  filters: UploadJobFilters;
  onApply: (filters: UploadJobFilters) => void;
  activeCount: number;
};

export function UploadJobFilterSheet({
  filters,
  onApply,
  activeCount,
}: UploadJobFilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
          <SheetTitle>Filter upload jobs</SheetTitle>
          <SheetDescription>
            Narrow jobs by upload type or processing status.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 px-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onApply({
              type: String(
                data.get("type") ?? "all",
              ) as UploadJobFilters["type"],
              status: String(
                data.get("status") ?? "all",
              ) as UploadJobFilters["status"],
            });
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="upload-job-type">Type</Label>
            <Select name="type" defaultValue={filters.type}>
              <SelectTrigger id="upload-job-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(uploadJobTypeLabels) as UploadJobType[]).map(
                  (type) => (
                    <SelectItem key={type} value={type}>
                      {uploadJobTypeLabels[type]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-job-status">Status</Label>
            <Select name="status" defaultValue={filters.status}>
              <SelectTrigger id="upload-job-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(uploadJobStatusLabels) as UploadJobStatus[]).map(
                  (status) => (
                    <SelectItem key={status} value={status}>
                      {uploadJobStatusLabels[status]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <SheetFooter>
            <Button type="submit">Apply filters</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onApply(defaultUploadJobFilters);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
