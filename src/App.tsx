import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestRoute } from "@/components/auth/GuestRoute";
import { CustomerProtectedRoute } from "@/components/auth/CustomerProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ShopLayout } from "@/components/layout/ShopLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { CategoryMasterPage } from "@/pages/categories/CategoryMasterPage";
import { ProductListPage } from "@/pages/products/ProductListPage";
import { ProductBulkPreparePage } from "@/pages/products/ProductBulkPreparePage";
import { AddProductPage } from "@/pages/products/AddProductPage";
import { EditProductPage } from "@/pages/products/EditProductPage";
import { ProductDetailPage } from "@/pages/products/ProductDetailPage";
import { CreateQuotationPage } from "@/pages/quotations/CreateQuotationPage";
import { EditQuotationPage } from "@/pages/quotations/EditQuotationPage";
import { QuotationDetailPage } from "@/pages/quotations/QuotationDetailPage";
import { QuotationListPage } from "@/pages/quotations/QuotationListPage";
import { UploadJobListPage } from "@/pages/upload-jobs/UploadJobListPage";
import { OrderListPage } from "@/pages/orders/OrderListPage";
import { OrderDetailPage } from "@/pages/orders/OrderDetailPage";
import { PaymentListPage } from "@/pages/payments/PaymentListPage";
import { PaymentDetailPage } from "@/pages/payments/PaymentDetailPage";
import { RefundListPage } from "@/pages/refunds/RefundListPage";
import { RefundDetailPage } from "@/pages/refunds/RefundDetailPage";
import { ReferralListPage } from "@/pages/referrals/ReferralListPage";
import { WalletWithdrawalListPage } from "@/pages/wallet/WalletWithdrawalListPage";
import { WalletWithdrawalDetailPage } from "@/pages/wallet/WalletWithdrawalDetailPage";
import { CartListPage } from "@/pages/carts/CartListPage";
import { CartDetailPage } from "@/pages/carts/CartDetailPage";
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
import { StaffDetailPage } from "@/pages/staff/StaffDetailPage";
import { StaffAccountPage } from "@/pages/staff/StaffAccountPage";
import { RoleListPage } from "@/pages/roles/RoleListPage";
import { RoleCreatePage } from "@/pages/roles/RoleCreatePage";
import { RoleDetailPage } from "@/pages/roles/RoleDetailPage";
import { SupportTicketListPage } from "@/pages/support-tickets/SupportTicketListPage";
import { SupportTicketDetailPage } from "@/pages/support-tickets/SupportTicketDetailPage";
import { WebsiteHomePage } from "@/pages/website/WebsiteHomePage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { ReviewListPage } from "@/pages/reviews/ReviewListPage";
import { ContactInquiryListPage } from "@/pages/contact/ContactInquiryListPage";
import { ContactInquiryDetailPage } from "@/pages/contact/ContactInquiryDetailPage";
import { CareerApplicationListPage } from "@/pages/careers/CareerApplicationListPage";
import { CareerApplicationDetailPage } from "@/pages/careers/CareerApplicationDetailPage";
import { CustomizationRequestListPage } from "@/pages/customization-requests/CustomizationRequestListPage";
import { CustomizationRequestDetailPage } from "@/pages/customization-requests/CustomizationRequestDetailPage";
import { ShopHomePage } from "@/pages/shop/ShopHomePage";
import { ShopCatalogPage } from "@/pages/shop/ShopCatalogPage";
import { ShopProductPage } from "@/pages/shop/ShopProductPage";
import { ShopContactPage } from "@/pages/shop/ShopContactPage";
import { ShopCareersPage } from "@/pages/shop/ShopCareersPage";
import { CartPage } from "@/pages/shop/CartPage";
import { CheckoutPage } from "@/pages/shop/CheckoutPage";
import { ShopOrderPage } from "@/pages/shop/ShopOrderPage";
import { AccountPage } from "@/pages/shop/AccountPage";
import { ShopCustomizePage } from "@/pages/shop/ShopCustomizePage";
import { ShopCustomizationRequestsPage } from "@/pages/shop/ShopCustomizationRequestsPage";
import { ShopCustomizationRequestDetailPage } from "@/pages/shop/ShopCustomizationRequestDetailPage";
import { ShopReferralsPage } from "@/pages/shop/ShopReferralsPage";
import { ShopWalletPage } from "@/pages/shop/ShopWalletPage";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import { StaffHomeRedirect } from "@/components/auth/StaffHomeRedirect";
import { PERMISSIONS } from "@/lib/roles";

const App = () => {
  return (
    <Routes>
      <Route element={<ShopLayout />}>
        <Route path="/shop" element={<ShopHomePage />} />
        <Route path="/shop/products" element={<ShopCatalogPage />} />
        <Route path="/shop/products/:id" element={<ShopProductPage />} />
        <Route path="/shop/contact" element={<ShopContactPage />} />
        <Route path="/shop/careers" element={<ShopCareersPage />} />
        <Route path="/shop/cart" element={<CartPage />} />
        <Route element={<CustomerProtectedRoute />}>
          <Route path="/shop/checkout" element={<CheckoutPage />} />
          <Route path="/shop/orders/:id" element={<ShopOrderPage />} />
          <Route path="/shop/account" element={<AccountPage />} />
          <Route path="/shop/referrals" element={<ShopReferralsPage />} />
          <Route path="/shop/wallet" element={<ShopWalletPage />} />
          <Route path="/shop/customize" element={<ShopCustomizePage />} />
          <Route
            path="/shop/customize/requests"
            element={<ShopCustomizationRequestsPage />}
          />
          <Route
            path="/shop/customize/requests/:id"
            element={<ShopCustomizationRequestDetailPage />}
          />
        </Route>
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_DASHBOARD} />
            }
          >
            <Route index element={<DashboardPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_REPORTS} />
            }
          >
            <Route path="reports" element={<Navigate to="/reports/products" replace />} />
            <Route path="reports/:reportKind" element={<ReportsPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_CATEGORIES} />
            }
          >
            <Route path="categories" element={<CategoryMasterPage />} />
          </Route>
          <Route path="website" element={<Navigate to="/website/home" replace />} />
          <Route
            element={<PermissionRoute permission={PERMISSIONS.VIEW_BANNERS} />}
          >
            <Route path="website/home" element={<WebsiteHomePage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_PRODUCTS} />
            }
          >
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="upload-jobs" element={<UploadJobListPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_QUOTATIONS} />
            }
          >
            <Route path="quotations" element={<QuotationListPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.CREATE_QUOTATIONS} />
            }
          >
            <Route path="quotations/new" element={<CreateQuotationPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_QUOTATIONS} />
            }
          >
            <Route path="quotations/:id" element={<QuotationDetailPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.UPDATE_QUOTATIONS} />
            }
          >
            <Route
              path="quotations/:id/edit"
              element={<EditQuotationPage />}
            />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.CREATE_PRODUCTS} />
            }
          >
            <Route path="products/new" element={<AddProductPage />} />
            <Route
              path="products/bulk-prepare"
              element={<ProductBulkPreparePage />}
            />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.UPDATE_PRODUCTS} />
            }
          >
            <Route path="products/:id/edit" element={<EditProductPage />} />
          </Route>
          <Route
            element={<PermissionRoute permission={PERMISSIONS.VIEW_ORDERS} />}
          >
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_ORDER_SUPPORT} />
            }
          >
            <Route path="support-tickets" element={<SupportTicketListPage />} />
            <Route
              path="support-tickets/:id"
              element={<SupportTicketDetailPage />}
            />
          </Route>
          <Route
            element={
              <PermissionRoute
                permission={PERMISSIONS.VIEW_CUSTOMIZATION_REQUESTS}
              />
            }
          >
            <Route
              path="customization-requests"
              element={<CustomizationRequestListPage />}
            />
            <Route
              path="customization-requests/:id"
              element={<CustomizationRequestDetailPage />}
            />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_PAYMENTS} />
            }
          >
            <Route path="payments" element={<PaymentListPage />} />
            <Route path="payments/:id" element={<PaymentDetailPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute
                permissions={[
                  PERMISSIONS.VIEW_PAYMENTS,
                  PERMISSIONS.VIEW_ORDERS,
                ]}
              />
            }
          >
            <Route path="refunds" element={<RefundListPage />} />
            <Route path="refunds/:id" element={<RefundDetailPage />} />
          </Route>
          <Route
            element={<PermissionRoute permission={PERMISSIONS.VIEW_WALLETS} />}
          >
            <Route
              path="wallet-withdrawals"
              element={<WalletWithdrawalListPage />}
            />
            <Route
              path="wallet-withdrawals/:id"
              element={<WalletWithdrawalDetailPage />}
            />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_REFERRALS} />
            }
          >
            <Route path="referrals" element={<ReferralListPage />} />
          </Route>
          <Route
            element={<PermissionRoute permission={PERMISSIONS.VIEW_COUPONS} />}
          >
            <Route path="coupons" element={<CouponListPage />} />
            <Route path="coupons/:id" element={<CouponDetailPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.CREATE_COUPONS} />
            }
          >
            <Route path="coupons/new" element={<AddCouponPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.UPDATE_COUPONS} />
            }
          >
            <Route path="coupons/:id/edit" element={<EditCouponPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_CUSTOMERS} />
            }
          >
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="carts" element={<CartListPage />} />
            <Route path="carts/:id" element={<CartDetailPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.UPDATE_CUSTOMERS} />
            }
          >
            <Route path="customers/new" element={<AddCustomerPage />} />
          </Route>
          <Route
            element={<PermissionRoute permission={PERMISSIONS.VIEW_REVIEWS} />}
          >
            <Route path="reviews" element={<ReviewListPage />} />
          </Route>
          <Route
            element={<PermissionRoute permission={PERMISSIONS.VIEW_ORDERS} />}
          >
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>
          <Route path="account" element={<StaffAccountPage />} />
          <Route element={<SuperAdminRoute />}>
            <Route path="roles" element={<RoleListPage />} />
            <Route path="roles/new" element={<RoleCreatePage />} />
            <Route path="roles/:id" element={<RoleDetailPage />} />
          </Route>
          <Route
            element={<PermissionRoute permission={PERMISSIONS.VIEW_STAFF} />}
          >
            <Route path="staff" element={<StaffListPage />} />
            <Route path="staff/:id" element={<StaffDetailPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.CREATE_STAFF} />
            }
          >
            <Route path="staff/new" element={<StaffCreatePage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_SETTINGS} />
            }
          >
            <Route path="contact" element={<ContactInquiryListPage />} />
            <Route path="contact/:id" element={<ContactInquiryDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permission={PERMISSIONS.VIEW_CAREERS} />
            }
          >
            <Route path="careers" element={<CareerApplicationListPage />} />
            <Route
              path="careers/:id"
              element={<CareerApplicationDetailPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<StaffHomeRedirect />} />
    </Routes>
  );
};

export default App;
