import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export function CustomerProtectedRoute() {
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/shop/cart"
        replace
        state={{ from: location.pathname, requireLogin: true }}
      />
    );
  }

  return <Outlet />;
}
