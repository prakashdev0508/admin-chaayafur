export const queryKeys = {
  orders: {
    all: ["orders"] as const,
    list: (params: Record<string, unknown>) => ["orders", "list", params] as const,
    detail: (id: number) => ["orders", "detail", id] as const,
    tracking: (id: number) => ["orders", "tracking", id] as const,
    auditLogs: (id: number, params?: Record<string, unknown>) =>
      ["orders", "audit-logs", id, params] as const,
    invoice: (id: number) => ["orders", "invoice", id] as const,
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
    detail: (id: number) => ["coupons", "detail", id] as const,
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
  dashboard: ["dashboard"] as const,
  staff: {
    all: ["staff"] as const,
    list: (params: Record<string, unknown>) => ["staff", "list", params] as const,
  },
  supportTickets: {
    all: ["support-tickets"] as const,
    list: (params: Record<string, unknown>) =>
      ["support-tickets", "list", params] as const,
    detail: (id: number) => ["support-tickets", "detail", id] as const,
  },
  shop: {
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
  },
};
