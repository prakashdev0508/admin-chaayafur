import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestRoute } from "@/components/auth/GuestRoute";
import { CustomerProtectedRoute } from "@/components/auth/CustomerProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ShopLayout } from "@/components/layout/ShopLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { CategoryMasterPage } from "@/pages/categories/CategoryMasterPage";
import { ProductListPage } from "@/pages/products/ProductListPage";
import { AddProductPage } from "@/pages/products/AddProductPage";
import { EditProductPage } from "@/pages/products/EditProductPage";
import { ProductDetailPage } from "@/pages/products/ProductDetailPage";
import { OrderListPage } from "@/pages/orders/OrderListPage";
import { OrderDetailPage } from "@/pages/orders/OrderDetailPage";
import { PaymentListPage } from "@/pages/payments/PaymentListPage";
import { PaymentDetailPage } from "@/pages/payments/PaymentDetailPage";
import { CouponListPage } from "@/pages/coupons/CouponListPage";
import { AddCouponPage } from "@/pages/coupons/AddCouponPage";
import {
  CouponDetailPage,
  EditCouponPage,
} from "@/pages/coupons/CouponDetailPage";
import { CustomerListPage } from "@/pages/customers/CustomerListPage";
import { AddCustomerPage } from "@/pages/customers/AddCustomerPage";
import { CustomerDetailPage } from "@/pages/customers/CustomerDetailPage";
import { AuditLogsPage } from "@/pages/audit-logs/AuditLogsPage";
import { StaffListPage } from "@/pages/staff/StaffListPage";
import { StaffCreatePage } from "@/pages/staff/StaffCreatePage";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import { SupportTicketListPage } from "@/pages/support-tickets/SupportTicketListPage";
import { SupportTicketDetailPage } from "@/pages/support-tickets/SupportTicketDetailPage";
import { WebsiteHomePage } from "@/pages/website/WebsiteHomePage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { ReviewListPage } from "@/pages/reviews/ReviewListPage";
import { ShopHomePage } from "@/pages/shop/ShopHomePage";
import { ShopCatalogPage } from "@/pages/shop/ShopCatalogPage";
import { ShopProductPage } from "@/pages/shop/ShopProductPage";
import { CartPage } from "@/pages/shop/CartPage";
import { CheckoutPage } from "@/pages/shop/CheckoutPage";
import { ShopOrderPage } from "@/pages/shop/ShopOrderPage";
import { AccountPage } from "@/pages/shop/AccountPage";

const App = () => {
  return (
    <Routes>
      <Route element={<ShopLayout />}>
        <Route path="/shop" element={<ShopHomePage />} />
        <Route path="/shop/products" element={<ShopCatalogPage />} />
        <Route path="/shop/products/:id" element={<ShopProductPage />} />
        <Route path="/shop/cart" element={<CartPage />} />
        <Route element={<CustomerProtectedRoute />}>
          <Route path="/shop/checkout" element={<CheckoutPage />} />
          <Route path="/shop/orders/:id" element={<ShopOrderPage />} />
          <Route path="/shop/account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="categories" element={<CategoryMasterPage />} />
          <Route path="website" element={<Navigate to="/website/home" replace />} />
          <Route path="website/home" element={<WebsiteHomePage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<AddProductPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="products/:id/edit" element={<EditProductPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="support-tickets" element={<SupportTicketListPage />} />
          <Route path="support-tickets/:id" element={<SupportTicketDetailPage />} />
          <Route path="payments" element={<PaymentListPage />} />
          <Route path="payments/:id" element={<PaymentDetailPage />} />
          <Route path="coupons" element={<CouponListPage />} />
          <Route element={<PermissionRoute permission="create-coupons" />}>
            <Route path="coupons/new" element={<AddCouponPage />} />
          </Route>
          <Route path="coupons/:id" element={<CouponDetailPage />} />
          <Route element={<PermissionRoute permission="update-coupons" />}>
            <Route path="coupons/:id/edit" element={<EditCouponPage />} />
          </Route>
          <Route path="customers" element={<CustomerListPage />} />
          <Route element={<PermissionRoute permission="update-customers" />}>
            <Route path="customers/new" element={<AddCustomerPage />} />
          </Route>
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route element={<PermissionRoute permission="view-reviews" />}>
            <Route path="reviews" element={<ReviewListPage />} />
          </Route>
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route element={<SuperAdminRoute />}>
            <Route path="staff" element={<StaffListPage />} />
            <Route element={<PermissionRoute permission="create-staff" />}>
              <Route path="staff/new" element={<StaffCreatePage />} />
            </Route>
          </Route>
          <Route element={<PermissionRoute permission="view-settings" />}>
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
