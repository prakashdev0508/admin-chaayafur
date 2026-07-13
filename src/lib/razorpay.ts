import type { Order, OrderPayment } from "@/types/order";

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
};

export type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-script";

export function canUseEmbeddedCheckout(payment: OrderPayment) {
  return Boolean(
    payment.keyId && payment.razorpayOrderId && payment.amountPaise,
  );
}

export function canUsePaymentLink(payment: OrderPayment) {
  return Boolean(payment.paymentLinkUrl);
}

function loadRazorpayScript() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  const existing = document.getElementById(RAZORPAY_SCRIPT_ID);
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

function getCheckoutPrefill(order: Order) {
  const address = order.shippingAddressRef;
  const fallbackPhone = order.customer.phone.replace(/\D/g, "").slice(-10);

  return {
    name: address?.name,
    email: address?.email ?? undefined,
    contact: address?.phone?.replace(/\D/g, "").slice(-10) || fallbackPhone,
  };
}

export type StartOrderPaymentResult = "embedded" | "redirect";

type StartOrderPaymentParams = {
  order: Order;
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onDismiss?: () => void;
};

export async function startOrderPayment({
  order,
  onSuccess,
  onDismiss,
}: StartOrderPaymentParams): Promise<StartOrderPaymentResult> {
  const payment = order.payment;

  if (canUseEmbeddedCheckout(payment)) {
    await loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error("Razorpay checkout is unavailable.");
    }

    const options: RazorpayCheckoutOptions = {
      key: payment.keyId!,
      amount: payment.amountPaise!,
      currency: payment.currency ?? "INR",
      order_id: payment.razorpayOrderId!,
      name: "Chaaya Furnitures",
      description: order.orderNumber,
      prefill: getCheckoutPrefill(order),
      handler: onSuccess,
      modal: {
        ondismiss: onDismiss,
      },
      theme: {
        color: "#8B5E3C",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
    return "embedded";
  }

  if (canUsePaymentLink(payment)) {
    window.location.href = payment.paymentLinkUrl!;
    return "redirect";
  }

  throw new Error("Payment checkout details are unavailable for this order.");
}

/** @deprecated Use startOrderPayment */
export const openRazorpayCheckout = startOrderPayment;
