export type CartItem = {
  productId: number;
  quantity: number;
  name: string;
  price: string;
  imageUrl?: string;
  slug?: string;
  stock?: number;
  isAvailable?: boolean;
};

export type CartOrderItem = {
  productId: number;
  quantity: number;
};

/** Line from GET /cart (server-computed pricing). */
export type ServerCartLine = {
  productId: number;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  name: string;
  slug: string;
  stock: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

export type CartResponse = {
  items: ServerCartLine[];
  itemCount: number;
  subtotalAmount: string;
};

export function serverCartLineToCartItem(line: ServerCartLine): CartItem {
  return {
    productId: line.productId,
    quantity: line.quantity,
    name: line.name,
    price: line.unitPrice,
    slug: line.slug,
    imageUrl: line.imageUrl ?? undefined,
    stock: line.stock,
    isAvailable: line.isAvailable,
  };
}

/** Slim row from GET /carts (staff) */
export type AdminCartListItem = {
  id: number;
  customerId: number;
  customerPhone: string;
  itemCount: number;
  lineCount: number;
  subtotalAmount: string;
  updatedAt: string;
  createdAt: string;
};

export type ListAdminCartsParams = {
  page?: number;
  limit?: number;
  customerId?: number;
  customerPhone?: string;
  hasItems?: boolean;
};

/** GET /carts/:cartId */
export type AdminCartDetail = {
  id: number;
  customerId: number;
  customer: { id: number; phone: string };
  items: ServerCartLine[];
  itemCount: number;
  subtotalAmount: string;
  createdAt: string;
  updatedAt: string;
};

export type SeedAdminCartPayload = {
  customerId: number;
  productId: number;
  quantity: number;
};

export type UpsertAdminCartItemPayload = {
  productId: number;
  quantity: number;
};
