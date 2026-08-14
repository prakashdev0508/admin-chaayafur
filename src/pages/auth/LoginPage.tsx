import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { StaffAuthLayout } from "@/components/auth/StaffAuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { resolvePostLoginPath } from "@/lib/staff-home";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const permissions = await login({ email, password });
      const requested =
        (location.state as { from?: string } | null)?.from ?? "/";
      const home = resolvePostLoginPath(
        requested,
        permissions.permissions,
        permissions.roleSlug ?? permissions.role,
      );
      navigate(home, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaffAuthLayout
      mobileTitle="Chaya Furnitures"
      mobileSubtitle="Sign in to the admin console"
      footer={
        <p className="mt-6 text-center text-xs text-muted-foreground lg:text-left">
          Need access? Contact your store administrator.
        </p>
      }
    >
      <div className="mb-8 hidden space-y-2 lg:block">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Welcome back
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Sign in to continue
        </h2>
        <p className="text-sm text-muted-foreground">
          Use your staff email and password.
        </p>
      </div>

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

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label
              htmlFor="password"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[#6b4e3d] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-border/80 bg-background/60 pr-11"
              minLength={6}
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
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </StaffAuthLayout>
  );
}
