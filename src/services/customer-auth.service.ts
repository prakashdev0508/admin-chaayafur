import { apiRequest } from "@/lib/api";
import type {
  CustomerProfile,
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "@/types/customer-auth";

export function sendCustomerOtp(payload: SendOtpPayload) {
  return apiRequest<SendOtpResponse>("/auth/customer/send-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}

export function verifyCustomerOtp(payload: VerifyOtpPayload) {
  return apiRequest<VerifyOtpResponse>("/auth/customer/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}

export function fetchCustomerProfile() {
  return apiRequest<CustomerProfile>("/users/me", {}, "customer");
}
