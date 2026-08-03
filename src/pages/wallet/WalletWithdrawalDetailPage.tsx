import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RejectWalletWithdrawalDialog } from "@/components/wallet/RejectWalletWithdrawalDialog";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  canReviewWalletWithdrawal,
  walletWithdrawalMethodLabels,
  walletWithdrawalStatusLabels,
  walletWithdrawalStatusVariants,
} from "@/lib/wallet-status";
import {
  approveWalletWithdrawal,
  getWalletWithdrawal,
  rejectWalletWithdrawal,
} from "@/services/wallets.service";

export function WalletWithdrawalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const withdrawalId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_WALLETS);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_WALLETS);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const withdrawalQuery = useQuery({
    queryKey: queryKeys.walletWithdrawals.detail(withdrawalId),
    queryFn: () => getWalletWithdrawal(withdrawalId),
    enabled: canView && Number.isFinite(withdrawalId),
  });

  function invalidate(customerId?: number) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.walletWithdrawals.all,
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.walletWithdrawals.detail(withdrawalId),
    });
    if (customerId != null) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.wallets.detail(customerId),
      });
    }
  }

  const approveMutation = useMutation({
    mutationFn: () => approveWalletWithdrawal(withdrawalId),
    onSuccess: (withdrawal) => {
      toast.success("Withdrawal approved — payout started");
      invalidate(withdrawal.customer?.id ?? withdrawal.customerId);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve withdrawal",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: Parameters<typeof rejectWalletWithdrawal>[1]) =>
      rejectWalletWithdrawal(withdrawalId, payload),
    onSuccess: (withdrawal) => {
      invalidate(withdrawal.customer?.id ?? withdrawal.customerId);
    },
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Withdrawal" description="Withdrawal details." />
        <EmptyState
          icon={Wallet}
          title="Access restricted"
          description="You do not have permission to view wallet withdrawals."
        />
      </div>
    );
  }

  if (withdrawalQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (withdrawalQuery.isError || !withdrawalQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Withdrawal" description="Withdrawal details." />
        <EmptyState
          icon={Wallet}
          title="Withdrawal not found"
          description={
            withdrawalQuery.error instanceof Error
              ? withdrawalQuery.error.message
              : "Could not load this withdrawal."
          }
        />
        <Link
          to="/wallet-withdrawals"
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Back to withdrawals
        </Link>
      </div>
    );
  }

  const withdrawal = withdrawalQuery.data;
  const customerId = withdrawal.customer?.id ?? withdrawal.customerId;
  const canReview =
    canUpdate && canReviewWalletWithdrawal(withdrawal.status);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Withdrawal #${withdrawal.id}`}
        description={`${formatCurrency(withdrawal.amount)} · ${walletWithdrawalMethodLabels[withdrawal.method]}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/wallet-withdrawals"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back
            </Link>
            {canReview && (
              <>
                <Button onClick={() => setApproveOpen(true)}>Approve</Button>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Payout details</CardTitle>
              <CardDescription>
                Approve starts a RazorpayX payout. Reject returns funds to
                available balance.
              </CardDescription>
            </div>
            <StatusBadge
              variant={walletWithdrawalStatusVariants[withdrawal.status]}
            >
              {walletWithdrawalStatusLabels[withdrawal.status]}
            </StatusBadge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(withdrawal.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="mt-1 font-medium">
                  {walletWithdrawalMethodLabels[withdrawal.method]}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account holder</p>
                <p className="mt-1 font-medium">
                  {withdrawal.accountHolderName || "—"}
                </p>
              </div>
            </div>

            {withdrawal.method === "UPI" ? (
              <div>
                <p className="text-xs text-muted-foreground">UPI VPA</p>
                <p className="mt-1 font-mono text-sm">
                  {withdrawal.upiVpa || "—"}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Account number</p>
                  <p className="mt-1 font-mono text-sm">
                    {withdrawal.bankAccountNumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IFSC</p>
                  <p className="mt-1 font-mono text-sm">
                    {withdrawal.bankIfsc || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="mt-1">{withdrawal.bankName || "—"}</p>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Requested</p>
                <p className="mt-1">{formatDate(withdrawal.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="mt-1">{formatDate(withdrawal.updatedAt)}</p>
              </div>
            </div>

            {withdrawal.razorpayPayoutId && (
              <div>
                <p className="text-xs text-muted-foreground">RazorpayX payout ID</p>
                <p className="mt-1 font-mono text-xs">
                  {withdrawal.razorpayPayoutId}
                </p>
              </div>
            )}

            {withdrawal.rejectionReason && (
              <div>
                <p className="text-xs text-muted-foreground">Rejection reason</p>
                <p className="mt-1 text-destructive">
                  {withdrawal.rejectionReason}
                </p>
              </div>
            )}

            {withdrawal.failureReason && (
              <div>
                <p className="text-xs text-muted-foreground">Failure reason</p>
                <p className="mt-1 text-destructive">
                  {withdrawal.failureReason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {customerId != null ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <Link
                    to={`/customers/${customerId}`}
                    className="mt-1 font-medium hover:underline"
                  >
                    {withdrawal.customer?.phone
                      ? formatPhone(withdrawal.customer.phone)
                      : `Customer #${customerId}`}
                  </Link>
                </div>
                <Link
                  to={`/wallet-withdrawals?customerId=${customerId}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-fit",
                  )}
                >
                  All withdrawals
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">No customer linked.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve withdrawal?"
        description="This starts a RazorpayX payout to the customer’s UPI or bank account. The wallet debit is recorded when the payout succeeds."
        confirmLabel="Approve payout"
        loading={approveMutation.isPending}
        onConfirm={() => approveMutation.mutateAsync()}
      />

      <RejectWalletWithdrawalDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        loading={rejectMutation.isPending}
        onSubmit={(payload) => rejectMutation.mutateAsync(payload)}
      />
    </div>
  );
}
