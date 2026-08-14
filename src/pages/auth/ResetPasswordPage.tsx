import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { StaffAuthLayout } from "@/components/auth/StaffAuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { resetStaffPasswordWithToken } from "@/services/auth.service";
import { cn } from "@/lib/utils";

const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < PASSWORD_MIN || newPassword.length > PASSWORD_MAX) {
      setError(`Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetStaffPasswordWithToken({
        token,
        newPassword,
      });
      setSuccessMessage(
        result.message || "Password updated successfully",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to reset password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const missingToken = !token;

  return (
    <StaffAuthLayout
      mobileTitle="Set a new password"
      mobileSubtitle="Use the link from your email"
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
          Reset password
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a new password for your staff account.
        </p>
      </div>

      {missingToken ? (
        <div className="space-y-5">
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
          >
            This reset link is missing a token. Request a new link from the
            sign-in page.
          </div>
          <Button
            variant="outline"
            className="h-11 w-full gap-2"
            render={<Link to="/forgot-password" />}
          >
            Request a new link
          </Button>
        </div>
      ) : successMessage ? (
        <div className="space-y-5">
          <div
            role="status"
            className="rounded-xl border border-[#6b4e3d]/15 bg-[#6b4e3d]/6 px-3 py-2.5 text-sm text-[#3d3228]"
          >
            {successMessage}
          </div>
          <Button
            className={cn(
              "h-11 w-full gap-2 text-sm font-medium",
              "shadow-[0_12px_30px_-12px_rgba(107,78,61,0.55)]",
            )}
            render={<Link to="/login" />}
          >
            <ArrowLeft className="size-4" />
            Sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              New password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 border-border/80 bg-background/60 pr-11"
                minLength={PASSWORD_MIN}
                maxLength={PASSWORD_MAX}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 border-border/80 bg-background/60"
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
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
                Updating password...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      )}
    </StaffAuthLayout>
  );
}
