export const queryKeys = {
  orders: {
    all: ["orders"] as const,
    list: (params: Record<string, unknown>) => ["orders", "list", params] as const,
    detail: (id: number) => ["orders", "detail", id] as const,
    tracking: (id: number) => ["orders", "tracking", id] as const,
    auditLogs: (id: number, params?: Record<string, unknown>) =>
      ["orders", "audit-logs", id, params] as const,
    invoice: (id: number) => ["orders", "invoice", id] as const,
    refund: (id: number) => ["orders", "refund", id] as const,
  },
  refunds: {
    all: ["refunds"] as const,
    list: (params: Record<string, unknown>) =>
      ["refunds", "list", params] as const,
    detail: (id: number) => ["refunds", "detail", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (params: Record<string, unknown>) =>
      ["payments", "list", params] as const,
    detail: (id: number) => ["payments", "detail", id] as const,
  },
  coupons: {
    all: ["coupons"] as const,
    list: (params: Record<string, unknown>) =>
      ["coupons", "list", params] as const,
    detail: (id: number, params?: Record<string, unknown>) =>
      ["coupons", "detail", id, params] as const,
  },
  carts: {
    all: ["carts"] as const,
    list: (params: Record<string, unknown>) =>
      ["carts", "list", params] as const,
    detail: (id: number) => ["carts", "detail", id] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: (params: Record<string, unknown>) =>
      ["customers", "list", params] as const,
    detail: (id: number) => ["customers", "detail", id] as const,
    orders: (id: number, params?: Record<string, unknown>) =>
      ["customers", "orders", id, params] as const,
    auditLogs: (id: number, params?: Record<string, unknown>) =>
      ["customers", "audit-logs", id, params] as const,
  },
  auditLogs: {
    list: (params: Record<string, unknown>) =>
      ["audit-logs", "list", params] as const,
  },
  products: {
    list: (params: Record<string, unknown>) =>
      ["products", "list", params] as const,
  },
  categories: {
    all: ["categories"] as const,
    tree: ["categories", "tree"] as const,
    adminTree: ["categories", "admin-tree"] as const,
    list: ["categories", "list"] as const,
    detail: (id: number) => ["categories", "detail", id] as const,
    subCategories: (params: Record<string, unknown>) =>
      ["sub-categories", "list", params] as const,
    subCategoryDetail: (id: number) => ["sub-categories", "detail", id] as const,
  },
  dashboard: (params: Record<string, unknown>) =>
    ["dashboard", params] as const,
  reports: {
    products: (params: Record<string, unknown>) =>
      ["reports", "products", params] as const,
    sales: (params: Record<string, unknown>) =>
      ["reports", "sales", params] as const,
    orders: (params: Record<string, unknown>) =>
      ["reports", "orders", params] as const,
    inventory: (params: Record<string, unknown>) =>
      ["reports", "inventory", params] as const,
    customers: (params: Record<string, unknown>) =>
      ["reports", "customers", params] as const,
    payments: (params: Record<string, unknown>) =>
      ["reports", "payments", params] as const,
  },
  staff: {
    all: ["staff"] as const,
    list: (params: Record<string, unknown>) => ["staff", "list", params] as const,
    detail: (id: number) => ["staff", "detail", id] as const,
    me: ["staff", "me"] as const,
  },
  roles: {
    all: ["roles"] as const,
    list: ["roles", "list"] as const,
    detail: (id: number) => ["roles", "detail", id] as const,
    permissions: ["roles", "permissions-catalog"] as const,
  },
  supportTickets: {
    all: ["support-tickets"] as const,
    list: (params: Record<string, unknown>) =>
      ["support-tickets", "list", params] as const,
    detail: (id: number) => ["support-tickets", "detail", id] as const,
  },
  admin: {
    banners: {
      all: ["admin", "banners"] as const,
      list: (params: Record<string, unknown>) =>
        ["admin", "banners", "list", params] as const,
      detail: (id: number) => ["admin", "banners", "detail", id] as const,
    },
    siteSettings: ["admin", "site-settings"] as const,
    shippingPincodes: {
      all: ["admin", "shipping-pincodes"] as const,
      list: (params: Record<string, unknown>) =>
        ["admin", "shipping-pincodes", "list", params] as const,
    },
  },
  shop: {
    siteSettings: ["shop", "site-settings"] as const,
    shippingQuote: (params: { pincode: string; subtotal: number }) =>
      ["shop", "shipping-quote", params] as const,
    home: ["shop", "home"] as const,
    products: {
      list: (params: Record<string, unknown>) =>
        ["shop", "products", "list", params] as const,
      detail: (id: number) => ["shop", "products", "detail", id] as const,
    },
    categories: {
      tree: ["shop", "categories", "tree"] as const,
    },
    orders: {
      list: (params: Record<string, unknown>) =>
        ["shop", "orders", "list", params] as const,
      detail: (id: number) => ["shop", "orders", "detail", id] as const,
      tracking: (id: number) => ["shop", "orders", "tracking", id] as const,
    },
    cart: ["shop", "cart"] as const,
    addresses: {
      all: ["shop", "addresses"] as const,
    },
    coupons: {
      public: ["shop", "coupons", "public"] as const,
    },
    supportTickets: {
      byOrder: (orderId: number) =>
        ["shop", "support-tickets", "order", orderId] as const,
      detail: (id: number) => ["shop", "support-tickets", "detail", id] as const,
    },
    reviews: {
      mine: ["shop", "reviews", "mine"] as const,
      product: (productId: number, params?: Record<string, unknown>) =>
        ["shop", "reviews", "product", productId, params] as const,
    },
  },
  reviews: {
    all: ["reviews"] as const,
    list: (params: Record<string, unknown>) =>
      ["reviews", "list", params] as const,
  },
};
