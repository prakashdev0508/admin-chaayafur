import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import {
  walletWithdrawalMethodLabels,
  walletWithdrawalStatusLabels,
  walletWithdrawalStatusVariants,
} from "@/lib/wallet-status";
import { cn } from "@/lib/utils";
import {
  createWithdrawal,
  getMyPayoutMethods,
  getMyWallet,
  listMyWalletTransactions,
  listMyWithdrawals,
} from "@/services/shop-wallet.service";
import type {
  CreateWalletWithdrawalPayload,
  WalletWithdrawalMethod,
} from "@/types/wallet";

const MIN_WITHDRAWAL = 100;

export function ShopWalletPage() {
  const queryClient = useQueryClient();

  const walletQuery = useQuery({
    queryKey: queryKeys.shop.wallet,
    queryFn: getMyWallet,
  });

  const methodsQuery = useQuery({
    queryKey: queryKeys.shop.payoutMethods,
    queryFn: getMyPayoutMethods,
  });

  const withdrawalsQuery = useQuery({
    queryKey: queryKeys.shop.walletWithdrawals.list({ page: 1, limit: 10 }),
    queryFn: () => listMyWithdrawals({ page: 1, limit: 10 }),
  });

  const transactionsQuery = useQuery({
    queryKey: queryKeys.shop.walletTransactions.list({ page: 1, limit: 10 }),
    queryFn: () => listMyWalletTransactions({ page: 1, limit: 10 }),
  });

  const wallet = walletQuery.data;
  const withdrawable = wallet ? parseFloat(wallet.balance) : 0;
  const openWithdrawal = useMemo(
    () =>
      withdrawalsQuery.data?.items.find(
        (item) => item.status === "PENDING" || item.status === "PROCESSING",
      ) ?? null,
    [withdrawalsQuery.data],
  );

  const canWithdraw =
    withdrawable >= MIN_WITHDRAWAL &&
    openWithdrawal == null &&
    !walletQuery.isLoading;

  const [method, setMethod] = useState<WalletWithdrawalMethod>("UPI");
  const [amount, setAmount] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [upiVpa, setUpiVpa] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    const methods = methodsQuery.data;
    if (!methods) return;
    if (methods.preferredMethod) {
      setMethod(methods.preferredMethod);
    }
    if (methods.upi) {
      setUpiVpa(methods.upi.upiVpa);
      if (methods.preferredMethod !== "BANK") {
        setAccountHolderName(methods.upi.accountHolderName);
      }
    }
    if (methods.bank) {
      setBankAccountNumber(methods.bank.accountNumber);
      setBankIfsc(methods.bank.ifsc);
      setBankName(methods.bank.bankName ?? "");
      if (methods.preferredMethod === "BANK") {
        setAccountHolderName(methods.bank.accountHolderName);
      }
    }
  }, [methodsQuery.data]);

  useEffect(() => {
    const methods = methodsQuery.data;
    if (!methods) return;
    if (method === "UPI" && methods.upi) {
      setAccountHolderName(methods.upi.accountHolderName);
      setUpiVpa(methods.upi.upiVpa);
    }
    if (method === "BANK" && methods.bank) {
      setAccountHolderName(methods.bank.accountHolderName);
      setBankAccountNumber(methods.bank.accountNumber);
      setBankIfsc(methods.bank.ifsc);
      setBankName(methods.bank.bankName ?? "");
    }
  }, [method, methodsQuery.data]);

  const withdrawMutation = useMutation({
    mutationFn: createWithdrawal,
    onSuccess: () => {
      toast.success("Withdrawal requested — awaiting admin approval");
      setAmount("");
      void queryClient.invalidateQueries({ queryKey: queryKeys.shop.wallet });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shop.walletWithdrawals.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shop.payoutMethods,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not request withdrawal",
      );
    },
  });

  function handleWithdraw(event: React.FormEvent) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAWAL}`);
      return;
    }
    if (parsedAmount > withdrawable) {
      toast.error("Amount exceeds wallet balance");
      return;
    }
    if (!accountHolderName.trim()) {
      toast.error("Account holder name is required");
      return;
    }

    const payload: CreateWalletWithdrawalPayload = {
      amount: parsedAmount,
      method,
      accountHolderName: accountHolderName.trim(),
    };

    if (method === "UPI") {
      if (!upiVpa.trim()) {
        toast.error("UPI ID is required");
        return;
      }
      payload.upiVpa = upiVpa.trim();
    } else {
      const account = bankAccountNumber.trim();
      const ifsc = bankIfsc.trim().toUpperCase();
      if (!/^\d{6,18}$/.test(account)) {
        toast.error("Enter a valid bank account number (6–18 digits)");
        return;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        toast.error("Enter a valid IFSC code");
        return;
      }
      payload.bankAccountNumber = account;
      payload.bankIfsc = ifsc;
      if (bankName.trim()) payload.bankName = bankName.trim();
    }

    withdrawMutation.mutate(payload);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium text-[#3D2B1F]">Wallet</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Referral earnings land here after a friend’s order is delivered.
          </p>
        </div>
        <Link
          to="/shop/account"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to account
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {walletQuery.isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : walletQuery.isError ? (
          <p className="col-span-full text-sm text-destructive">
            {walletQuery.error instanceof Error
              ? walletQuery.error.message
              : "Could not load wallet"}
          </p>
        ) : wallet ? (
          <>
            <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="mt-1 text-2xl font-medium text-[#3D2B1F]">
                {formatCurrency(wallet.balance)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="mt-1 text-2xl font-medium text-[#3D2B1F]">
                {formatCurrency(wallet.availableBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="mt-1 text-2xl font-medium text-[#3D2B1F]">
                {formatCurrency(wallet.pendingBalance)}
              </p>
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#E8DFD3] bg-white p-5">
        <h2 className="text-lg font-medium text-[#3D2B1F]">Withdraw</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Minimum ₹{MIN_WITHDRAWAL}. Payouts go via UPI or bank IMPS after staff
          approval.
        </p>

        {!canWithdraw && (
          <p className="mt-3 text-sm text-muted-foreground">
            {openWithdrawal
              ? `You already have a ${walletWithdrawalStatusLabels[openWithdrawal.status].toLowerCase()} withdrawal (#${openWithdrawal.id}). Wait for it to finish before requesting another.`
              : withdrawable < MIN_WITHDRAWAL
                ? `Wallet balance must be at least ₹${MIN_WITHDRAWAL} to withdraw.`
                : null}
          </p>
        )}

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => void handleWithdraw(event)}
        >
          <div className="flex flex-wrap gap-2">
            {(["UPI", "BANK"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant={method === option ? "default" : "outline"}
                className={
                  method === option
                    ? "bg-[#8B5E3C] hover:bg-[#744C31]"
                    : undefined
                }
                disabled={!canWithdraw || withdrawMutation.isPending}
                onClick={() => setMethod(option)}
              >
                {walletWithdrawalMethodLabels[option]}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (₹)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min={MIN_WITHDRAWAL}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canWithdraw || withdrawMutation.isPending}
                placeholder={`${MIN_WITHDRAWAL}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-holder">Account holder name</Label>
              <Input
                id="withdraw-holder"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                disabled={!canWithdraw || withdrawMutation.isPending}
              />
            </div>
          </div>

          {method === "UPI" ? (
            <div className="space-y-2">
              <Label htmlFor="withdraw-upi">UPI ID</Label>
              <Input
                id="withdraw-upi"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                disabled={!canWithdraw || withdrawMutation.isPending}
                placeholder="name@upi"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="withdraw-account">Account number</Label>
                <Input
                  id="withdraw-account"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  disabled={!canWithdraw || withdrawMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw-ifsc">IFSC</Label>
                <Input
                  id="withdraw-ifsc"
                  value={bankIfsc}
                  onChange={(e) =>
                    setBankIfsc(e.target.value.toUpperCase())
                  }
                  disabled={!canWithdraw || withdrawMutation.isPending}
                  placeholder="HDFC0001234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw-bank">Bank name (optional)</Label>
                <Input
                  id="withdraw-bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={!canWithdraw || withdrawMutation.isPending}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="bg-[#8B5E3C] hover:bg-[#744C31]"
            disabled={!canWithdraw || withdrawMutation.isPending}
          >
            {withdrawMutation.isPending ? "Submitting…" : "Request withdrawal"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-[#3D2B1F]">Withdrawals</h2>
        {withdrawalsQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (withdrawalsQuery.data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
        ) : (
          <div className="space-y-3">
            {withdrawalsQuery.data!.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8DFD3] bg-white p-4"
              >
                <div>
                  <p className="font-medium text-[#3D2B1F]">
                    {formatCurrency(item.amount)} ·{" "}
                    {walletWithdrawalMethodLabels[item.method]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    #{item.id} · {formatDate(item.createdAt)}
                    {item.method === "UPI" && item.upiVpa
                      ? ` · ${item.upiVpa}`
                      : ""}
                    {item.method === "BANK" && item.bankAccountNumber
                      ? ` · ${item.bankAccountNumber}`
                      : ""}
                  </p>
                  {(item.rejectionReason || item.failureReason) && (
                    <p className="mt-1 text-sm text-destructive">
                      {item.rejectionReason || item.failureReason}
                    </p>
                  )}
                </div>
                <StatusBadge
                  variant={walletWithdrawalStatusVariants[item.status]}
                >
                  {walletWithdrawalStatusLabels[item.status]}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-[#3D2B1F]">Ledger</h2>
        {transactionsQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (transactionsQuery.data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {transactionsQuery.data!.items.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8DFD3] bg-white p-4"
              >
                <div>
                  <p className="font-medium text-[#3D2B1F]">
                    {tx.type === "CREDIT" ? "+" : "−"}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tx.reason?.replaceAll("_", " ") || tx.type} ·{" "}
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
                <StatusBadge
                  variant={tx.type === "CREDIT" ? "success" : "neutral"}
                >
                  {tx.type}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        Earn more via{" "}
        <Link to="/shop/referrals" className="text-[#8B5E3C] hover:underline">
          Refer & earn
        </Link>
        .
      </p>
    </div>
  );
}
