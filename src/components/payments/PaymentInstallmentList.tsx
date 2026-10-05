import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  formatManualPaymentMode,
  isManualPaymentMode,
  manualPaymentModeVariants,
} from "@/lib/manual-payment-mode";
import type { ManualPaymentInstallment } from "@/types/order";
import { cn } from "@/lib/utils";

type PaymentInstallmentListProps = {
  installments: ManualPaymentInstallment[];
  className?: string;
  emptyMessage?: string;
};

export function PaymentInstallmentList({
  installments,
  className,
  emptyMessage = "No installments recorded yet.",
}: PaymentInstallmentListProps) {
  if (installments.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {installments.map((row, index) => {
        const mode = row.paymentMode;
        const modeVariant =
          mode && isManualPaymentMode(mode)
            ? manualPaymentModeVariants[mode]
            : "neutral";

        return (
          <li
            key={row.id}
            className="rounded-xl border bg-card px-3.5 py-3 text-sm shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                  <p className="text-base font-semibold tabular-nums tracking-tight">
                    {formatCurrency(row.amount)}
                  </p>
                  {mode ? (
                    <StatusBadge variant={modeVariant} className="h-6 px-2">
                      {formatManualPaymentMode(mode)}
                    </StatusBadge>
                  ) : null}
                </div>
                {row.transactionId ? (
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {row.transactionId}
                  </p>
                ) : null}
                {row.notes ? (
                  <p className="text-xs text-muted-foreground">{row.notes}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatDate(row.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
