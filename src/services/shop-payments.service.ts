import { apiRequest } from "@/lib/api";
import type { Order } from "@/types/order";
import type { Payment } from "@/types/payment";

export type VerifyPaymentPayload = {
  orderId: number;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
};

export type VerifyPaymentResponse = {
  payment: Payment;
  order: Order;
};

export function verifyPayment(payload: VerifyPaymentPayload) {
  return apiRequest<VerifyPaymentResponse>("/payments/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  }, "customer");
}
