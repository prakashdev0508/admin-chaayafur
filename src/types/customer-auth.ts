export type CustomerUser = {
  id: number;
  phone: string;
  lastLogin: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CustomerDefaultAddressSummary = {
  id: number;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string;
  state: string;
  isDefault: boolean;
};

export type CustomerProfileCounts = {
  addresses: number;
  orders: number;
  openTickets: number;
  productReviews: number;
  orderReviews: number;
  reviews: number;
};

export type CustomerProfile = CustomerUser & {
  updatedAt: string;
  addressCount: number;
  defaultAddress?: CustomerDefaultAddressSummary | null;
  counts?: CustomerProfileCounts;
};

export type CustomerSession = {
  accessToken: string;
  user: CustomerUser;
};

export type SendOtpPayload = {
  phone: string;
};

export type SendOtpResponse = {
  message: string;
  expiresInSeconds?: number;
  retryAfterSeconds?: number;
};

export type VerifyOtpPayload = {
  phone: string;
  otp: string;
};

export type VerifyOtpResponse = {
  accessToken: string;
  user: CustomerUser;
};
