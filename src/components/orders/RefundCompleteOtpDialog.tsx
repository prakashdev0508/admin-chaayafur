import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  requestOrderRefundCompleteOtp,
  verifyOrderRefundComplete,
} from "@/services/orders.service";
import type { OrderRefund } from "@/types/refund";

const OTP_LENGTH = 6;

type Step = "confirm" | "verify";

type RefundCompleteOtpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  refundId: number;
  amount: string;
  orderNumber: string;
  staffEmail?: string | null;
  onVerified: (refund: OrderRefund) => void;
};

export function RefundCompleteOtpDialog({
  open,
  onOpenChange,
  orderId,
  refundId,
  amount,
  orderNumber,
  staffEmail,
  onVerified,
}: RefundCompleteOtpDialogProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("confirm");
      setOtp("");
      setRetryAfter(0);
      setExpiresIn(null);
      setSending(false);
      setVerifying(false);
    }
  }, [open]);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(() => {
      setRetryAfter((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  function applyOtpResponse(response: {
    message: string;
    expiresInSeconds?: number;
    retryAfterSeconds?: number;
  }) {
    if (response.retryAfterSeconds != null && response.retryAfterSeconds > 0) {
      setRetryAfter(response.retryAfterSeconds);
      toast.message(response.message);
    } else {
      toast.success(response.message);
    }
    if (response.expiresInSeconds != null) {
      setExpiresIn(response.expiresInSeconds);
    }
    setStep("verify");
  }

  async function sendOtp() {
    setSending(true);
    try {
      const response = await requestOrderRefundCompleteOtp(orderId, refundId);
      applyOtpResponse(response);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to send refund OTP",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    const code = otp.trim();
    if (code.length !== OTP_LENGTH) {
      toast.error(`Enter the ${OTP_LENGTH}-digit OTP from your email`);
      return;
    }

    setVerifying(true);
    try {
      const refund = await verifyOrderRefundComplete(orderId, refundId, {
        otp: code,
      });
      onOpenChange(false);
      onVerified(refund);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Invalid or expired OTP",
      );
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "confirm" ? "Complete this refund?" : "Verify refund OTP"}
          </DialogTitle>
          <DialogDescription>
            {step === "confirm" ? (
              <>
                We&apos;ll email a {OTP_LENGTH}-digit one-time password to
                authorize a refund of {formatCurrency(amount)} for{" "}
                {orderNumber}
                {staffEmail ? (
                  <>
                    {" "}
                    to{" "}
                    <span className="font-medium text-foreground">
                      {staffEmail}
                    </span>
                  </>
                ) : null}
                . Razorpay is charged only after you verify the OTP.
              </>
            ) : (
              <>
                Enter the {OTP_LENGTH}-digit code
                {staffEmail ? (
                  <>
                    {" "}
                    sent to{" "}
                    <span className="font-medium text-foreground">
                      {staffEmail}
                    </span>
                  </>
                ) : (
                  " sent to your staff email"
                )}{" "}
                to complete the refund of {formatCurrency(amount)}.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "verify" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-otp">One-time password</Label>
              <Input
                id="refund-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder={`${OTP_LENGTH}-digit code`}
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH),
                  )
                }
                maxLength={OTP_LENGTH}
                disabled={verifying}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleVerify();
                  }
                }}
              />
              {expiresIn != null && (
                <p className="text-xs text-muted-foreground">
                  Code expires in about{" "}
                  {Math.max(1, Math.ceil(expiresIn / 60))} minute
                  {expiresIn >= 120 ? "s" : ""}.
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={sending || verifying || retryAfter > 0}
              onClick={() => void sendOtp()}
            >
              {sending
                ? "Sending…"
                : retryAfter > 0
                  ? `Resend in ${retryAfter}s`
                  : "Resend OTP"}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={sending || verifying}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {step === "confirm" ? (
            <Button
              type="button"
              variant="destructive"
              disabled={sending}
              onClick={() => void sendOtp()}
            >
              {sending ? "Sending…" : "Send OTP"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              disabled={verifying || sending || otp.length !== OTP_LENGTH}
              onClick={() => void handleVerify()}
            >
              {verifying ? "Verifying…" : "Verify & complete"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
