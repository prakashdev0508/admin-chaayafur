import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

type OTPLoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function OTPLoginDialog({ open, onOpenChange, onSuccess }: OTPLoginDialogProps) {
  const { sendOtp, verifyOtp } = useCustomerAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep("phone");
      setOtp("");
      setRetryAfter(0);
    }
  }, [open]);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(() => {
      setRetryAfter((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  async function handleSendOtp() {
    const normalized = phone.replace(/\D/g, "").slice(-10);
    if (normalized.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const response = await sendOtp({ phone: normalized });
      if (response.retryAfterSeconds) {
        setRetryAfter(response.retryAfterSeconds);
        toast.message(response.message);
        return;
      }
      setPhone(normalized);
      setStep("otp");
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.trim().length < 4) {
      toast.error("Enter the OTP sent to your phone");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ phone, otp: otp.trim() });
      toast.success("Logged in successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#E8DFD3] bg-[#FAF7F2] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login with OTP</DialogTitle>
          <DialogDescription>
            We will send a one-time password to your mobile number.
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-phone">Mobile number</Label>
              <Input
                id="shop-phone"
                inputMode="numeric"
                placeholder="9876543210"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <Button
              className="w-full bg-[#8B5E3C] hover:bg-[#744C31]"
              disabled={loading || retryAfter > 0}
              onClick={() => void handleSendOtp()}
            >
              {retryAfter > 0 ? `Resend in ${retryAfter}s` : loading ? "Sending..." : "Send OTP"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              OTP sent to +91 {phone}
            </p>
            <div className="space-y-2">
              <Label htmlFor="shop-otp">One-time password</Label>
              <Input
                id="shop-otp"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("phone")}>
                Change number
              </Button>
              <Button
                className="flex-1 bg-[#8B5E3C] hover:bg-[#744C31]"
                disabled={loading}
                onClick={() => void handleVerifyOtp()}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
