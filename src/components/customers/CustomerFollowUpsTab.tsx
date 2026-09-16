import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  NotebookPen,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/format";
import { formatIstDate, toIstDateString } from "@/lib/report-dates";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  createCustomerFollowUp,
  listCustomerFollowUps,
  updateCustomerFollowUp,
} from "@/services/customers.service";

type CustomerFollowUpsTabProps = {
  customerId: number;
  canEdit: boolean;
  enabled?: boolean;
};

export function CustomerFollowUpsTab({
  customerId,
  canEdit,
  enabled = true,
}: CustomerFollowUpsTabProps) {
  const queryClient = useQueryClient();
  const [remark, setRemark] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState(toIstDateString());
  const [pendingUpdate, setPendingUpdate] = useState<{
    id: number;
    isFollowedUp: boolean;
  } | null>(null);

  const followUpsQuery = useQuery({
    queryKey: queryKeys.customers.followUps(customerId),
    queryFn: () => listCustomerFollowUps(customerId),
    enabled: enabled && Number.isFinite(customerId),
  });

  const invalidateFollowUps = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.followUps(customerId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(customerId),
      }),
      queryClient.invalidateQueries({
        queryKey: ["customers", "day-follow-ups"],
      }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createCustomerFollowUp(customerId, {
        remark: remark.trim(),
        nextFollowUpDate,
      }),
    onSuccess: async () => {
      toast.success("Follow-up added");
      setRemark("");
      setNextFollowUpDate(toIstDateString());
      await invalidateFollowUps();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to add follow-up",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      followUpId,
      isFollowedUp,
    }: {
      followUpId: number;
      isFollowedUp: boolean;
    }) => updateCustomerFollowUp(customerId, followUpId, { isFollowedUp }),
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.isFollowedUp
          ? "Follow-up marked complete"
          : "Follow-up reopened",
      );
      setPendingUpdate(null);
      await invalidateFollowUps();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update follow-up",
      );
    },
  });

  const items = followUpsQuery.data?.items ?? [];
  const openCount = items.filter((item) => !item.isFollowedUp).length;
  const completedCount = items.length - openCount;
  const todayIst = toIstDateString();

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
      <Card className="overflow-hidden shadow-xs">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <NotebookPen className="size-4 text-muted-foreground" />
                Follow-up history
              </CardTitle>
              <CardDescription className="mt-1">
                All follow-ups, newest first. Dates in IST.
              </CardDescription>
            </div>
            {items.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                  {openCount} open
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                  {completedCount} done
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {followUpsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : followUpsQuery.isError ? (
            <p className="text-sm text-destructive">
              {followUpsQuery.error instanceof Error
                ? followUpsQuery.error.message
                : "Failed to load follow-ups"}
            </p>
          ) : items.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No follow-ups yet"
              description="Log a call or visit note and schedule the next follow-up date."
              className="py-8"
            />
          ) : (
            <ol className="relative space-y-0">
              {items.map((item, index) => {
                const completed = item.isFollowedUp;
                const nextDateIst = toIstDateString(
                  new Date(item.nextFollowUpDate),
                );
                const isDueToday = !completed && nextDateIst === todayIst;
                const isOverdue = !completed && nextDateIst < todayIst;
                const updating =
                  updateMutation.isPending &&
                  pendingUpdate?.id === item.id;

                return (
                  <li
                    key={item.id}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    <div className="flex w-4 shrink-0 flex-col items-center">
                      <span
                        className={cn(
                          "mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-background",
                          completed
                            ? "bg-emerald-500"
                            : isOverdue
                              ? "bg-destructive"
                              : isDueToday
                                ? "bg-amber-500"
                                : "bg-foreground/40",
                        )}
                      />
                      {index < items.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "min-w-0 flex-1 rounded-xl border px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
                        completed ? "bg-muted/30" : "bg-card",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {completed ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="size-3" />
                                Completed
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
                                  isOverdue
                                    ? "bg-destructive/10 text-destructive"
                                    : isDueToday
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                      : "bg-muted text-muted-foreground",
                                )}
                              >
                                <CalendarClock className="size-3" />
                                {isOverdue
                                  ? `Overdue · ${formatIstDate(item.nextFollowUpDate)}`
                                  : isDueToday
                                    ? "Due today"
                                    : `Next · ${formatIstDate(item.nextFollowUpDate)}`}
                              </span>
                            )}
                            {completed && (
                              <span className="text-xs text-muted-foreground">
                                Was due {formatIstDate(item.nextFollowUpDate)}
                              </span>
                            )}
                          </div>
                          <p
                            className={cn(
                              "whitespace-pre-wrap text-sm leading-relaxed",
                              completed && "text-muted-foreground",
                            )}
                          >
                            {item.remark}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                        {canEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              setPendingUpdate({
                                id: item.id,
                                isFollowedUp: !completed,
                              })
                            }
                          >
                            {updating ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : completed ? (
                              <RotateCcw className="size-4" />
                            ) : (
                              <CheckCircle2 className="size-4" />
                            )}
                            {completed ? "Reopen" : "Mark complete"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <Card className="overflow-hidden shadow-xs lg:sticky lg:top-4">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquarePlus className="size-4 text-muted-foreground" />
              Add follow-up
            </CardTitle>
            <CardDescription className="mt-1">
              Append a new note with the next scheduled date.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!remark.trim()) {
                  toast.error("Enter a remark.");
                  return;
                }
                if (!nextFollowUpDate) {
                  toast.error("Choose a next follow-up date.");
                  return;
                }
                createMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="follow-up-remark">Remark</Label>
                <Textarea
                  id="follow-up-remark"
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="Called customer; interested in dining set"
                  rows={5}
                  className="min-h-28 resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="follow-up-date">Next follow-up date (IST)</Label>
                <Input
                  id="follow-up-date"
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(event) => setNextFollowUpDate(event.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  createMutation.isPending ||
                  !remark.trim() ||
                  !nextFollowUpDate
                }
              >
                {createMutation.isPending ? "Adding…" : "Add follow-up"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={pendingUpdate !== null}
        onOpenChange={(open) => !open && setPendingUpdate(null)}
        title={
          pendingUpdate?.isFollowedUp
            ? "Mark follow-up complete?"
            : "Reopen follow-up?"
        }
        description={
          pendingUpdate?.isFollowedUp
            ? "It will stay in this history and drop off today’s agenda."
            : "It will show as open again and appear on the day agenda when due."
        }
        confirmLabel={
          pendingUpdate?.isFollowedUp ? "Mark complete" : "Reopen"
        }
        loading={updateMutation.isPending}
        onConfirm={() =>
          pendingUpdate
            ? updateMutation.mutateAsync({
                followUpId: pendingUpdate.id,
                isFollowedUp: pendingUpdate.isFollowedUp,
              })
            : Promise.resolve()
        }
      />
    </div>
  );
}
