export type CustomerUser = {
  id: number;
  phone: string;
  lastLogin: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CustomerProfile = CustomerUser & {
  updatedAt: string;
  addressCount: number;
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
