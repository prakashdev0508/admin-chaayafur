import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { formatPhone } from "@/lib/format";
import { formatIstDate, toIstDateString } from "@/lib/report-dates";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { listDayFollowUps } from "@/services/customers.service";

type TodaysFollowUpsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TodaysFollowUpsDialog({
  open,
  onOpenChange,
}: TodaysFollowUpsDialogProps) {
  const todayIst = toIstDateString();

  const followUpsQuery = useQuery({
    queryKey: queryKeys.customers.dayFollowUps(todayIst),
    queryFn: () => listDayFollowUps({ date: todayIst }),
    enabled: open,
  });

  const items = followUpsQuery.data?.items ?? [];
  const dateLabel = followUpsQuery.data?.date
    ? formatIstDate(followUpsQuery.data.date)
    : formatIstDate(todayIst);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Today&apos;s follow-ups</DialogTitle>
          <DialogDescription>
            Incomplete follow-ups scheduled for {dateLabel} (IST).
          </DialogDescription>
        </DialogHeader>

        {followUpsQuery.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : followUpsQuery.isError ? (
          <p className="text-sm text-destructive">
            {followUpsQuery.error instanceof Error
              ? followUpsQuery.error.message
              : "Failed to load follow-ups"}
          </p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No open follow-ups scheduled for today.
          </p>
        ) : (
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {items.map((item) => {
              const customerId = item.customerId ?? item.customer?.id;
              const phone = item.customer?.phone;
              const href =
                customerId != null
                  ? `/customers/${customerId}?tab=follow-ups`
                  : null;

              return (
                <li key={item.id}>
                  {href ? (
                    <Link
                      to={href}
                      onClick={() => onOpenChange(false)}
                      className="block rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span
                          className={cn(
                            buttonVariants({ variant: "link" }),
                            "h-auto p-0 font-medium",
                          )}
                        >
                          {phone ? formatPhone(phone) : `Customer #${customerId}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatIstDate(item.nextFollowUpDate)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {item.remark}
                      </p>
                    </Link>
                  ) : (
                    <div className="rounded-lg border px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="font-medium text-muted-foreground">
                          Customer #—
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatIstDate(item.nextFollowUpDate)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {item.remark}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
