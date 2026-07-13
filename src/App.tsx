import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestRoute } from "@/components/auth/GuestRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ProductListPage } from "@/pages/products/ProductListPage";
import { AddProductPage } from "@/pages/products/AddProductPage";
import { EditProductPage } from "@/pages/products/EditProductPage";
import { ProductDetailPage } from "@/pages/products/ProductDetailPage";
import { OrderListPage } from "@/pages/orders/OrderListPage";
import { OrderDetailPage } from "@/pages/orders/OrderDetailPage";
import { PaymentListPage } from "@/pages/payments/PaymentListPage";
import { PaymentDetailPage } from "@/pages/payments/PaymentDetailPage";
import { CouponsPlaceholder } from "@/pages/coupons/CouponsPlaceholder";
import { CustomersPlaceholder } from "@/pages/customers/CustomersPlaceholder";
import { AuditLogsPlaceholder } from "@/pages/audit-logs/AuditLogsPlaceholder";

const App = () => {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<AddProductPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="products/:id/edit" element={<EditProductPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="payments" element={<PaymentListPage />} />
          <Route path="payments/:id" element={<PaymentDetailPage />} />
          <Route path="coupons" element={<CouponsPlaceholder />} />
          <Route path="customers" element={<CustomersPlaceholder />} />
          <Route path="audit-logs" element={<AuditLogsPlaceholder />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
