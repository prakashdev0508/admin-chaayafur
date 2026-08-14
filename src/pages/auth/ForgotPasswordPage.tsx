import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { StaffAuthLayout } from "@/components/auth/StaffAuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { forgotStaffPassword } from "@/services/auth.service";
import { cn } from "@/lib/utils";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await forgotStaffPassword({ email: email.trim() });
      setSuccessMessage(
        result.message ||
          "If an account exists for this email, a password reset link has been sent.",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to send a reset link. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaffAuthLayout
      mobileTitle="Reset password"
      mobileSubtitle="We’ll email you a reset link"
      footer={
        <p className="mt-6 text-center text-xs text-muted-foreground lg:text-left">
          <Link to="/login" className="font-medium text-[#6b4e3d] hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <div className="mb-8 space-y-2">
        <p className="hidden text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground lg:block">
          Staff access
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Forgot password
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your staff email. If an account exists, we’ll send a reset
          link that expires in one hour.
        </p>
      </div>

      {successMessage ? (
        <div className="space-y-5">
          <div
            role="status"
            className="rounded-xl border border-[#6b4e3d]/15 bg-[#6b4e3d]/6 px-3 py-2.5 text-sm text-[#3d3228]"
          >
            {successMessage}
          </div>
          <Button
            variant="outline"
            className="h-11 w-full gap-2"
            render={<Link to="/login" />}
          >
            <ArrowLeft className="size-4" />
            Return to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@chaaya.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border-border/80 bg-background/60"
              required
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className={cn(
              "h-11 w-full gap-2 text-sm font-medium",
              "shadow-[0_12px_30px_-12px_rgba(107,78,61,0.55)]",
            )}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </StaffAuthLayout>
  );
}
