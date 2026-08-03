import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import {
  referralStatusLabels,
  referralStatusVariants,
} from "@/lib/referral-status";
import { cn } from "@/lib/utils";
import {
  getMyReferral,
  listMyReferrals,
} from "@/services/shop-referrals.service";

async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

export function ShopReferralsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const codeQuery = useQuery({
    queryKey: queryKeys.shop.referral,
    queryFn: getMyReferral,
  });

  const listQuery = useQuery({
    queryKey: queryKeys.shop.referrals.list({ page, limit: pageSize }),
    queryFn: () => listMyReferrals({ page, limit: pageSize }),
  });

  const code = codeQuery.data;
  const referrals = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium text-[#3D2B1F]">Refer & earn</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Share your code with friends. They get no discount — you earn about
            5% of their order total after delivery.
          </p>
        </div>
        <Link
          to="/shop/account"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to account
        </Link>
      </div>

      <section className="rounded-2xl border border-[#E8DFD3] bg-white p-5">
        <h2 className="text-lg font-medium text-[#3D2B1F]">Your referral code</h2>
        {codeQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : codeQuery.isError ? (
          <p className="mt-3 text-sm text-destructive">
            {codeQuery.error instanceof Error
              ? codeQuery.error.message
              : "Could not load your referral code"}
          </p>
        ) : code ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-2xl font-medium tracking-wide text-[#3D2B1F]">
                {code.code}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void copyText("Code", code.code)}
              >
                <Copy className="size-4" />
                Copy code
              </Button>
            </div>
            {code.shareUrl && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Share link</p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-all font-mono text-sm text-[#3D2B1F]">
                    {code.shareUrl}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyText("Link", code.shareUrl!)}
                  >
                    <Copy className="size-4" />
                    Copy link
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-[#3D2B1F]">Your referrals</h2>
        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : listQuery.isError ? (
          <p className="text-sm text-destructive">
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : "Could not load referrals"}
          </p>
        ) : referrals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DFD3] bg-white p-8 text-center text-sm text-muted-foreground">
            No referrals yet. Share your code to start earning.
          </p>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="rounded-2xl border border-[#E8DFD3] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      to={`/shop/orders/${referral.order.id}`}
                      className="font-medium text-[#3D2B1F] hover:underline"
                    >
                      {referral.order.orderNumber}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Friend {formatPhone(referral.referee.phone)} · Order{" "}
                      {formatCurrency(referral.orderTotalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(referral.createdAt)}
                      {referral.creditedAt
                        ? ` · Credited ${formatDate(referral.creditedAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge
                      variant={referralStatusVariants[referral.status]}
                    >
                      {referralStatusLabels[referral.status]}
                    </StatusBadge>
                    <p className="mt-2 font-medium text-[#3D2B1F]">
                      {formatCurrency(referral.commissionAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(Number(referral.commissionRate) * 100).toFixed(0)}%
                      commission
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        Withdraw earnings from your{" "}
        <Link to="/shop/wallet" className="text-[#8B5E3C] hover:underline">
          wallet
        </Link>
        .
      </p>
    </div>
  );
}
