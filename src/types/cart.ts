export type CartItem = {
  productId: number;
  quantity: number;
  name: string;
  price: string;
  imageUrl?: string;
  slug?: string;
};

export type CartOrderItem = {
  productId: number;
  quantity: number;
};
