export type WalletWithdrawalStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REJECTED";

export type WalletWithdrawalMethod = "UPI" | "BANK";

export type WalletBalances = {
  balance: string;
  availableBalance: string;
  pendingBalance: string;
};

/** @deprecated Prefer WalletBalances; kept for admin customer wallet view */
export type AdminWalletBalances = WalletBalances & {
  customerId?: number;
  customer?: {
    id: number;
    phone: string;
  } | null;
};

export type WalletTransactionType = "CREDIT" | "DEBIT";

export type WalletTransaction = {
  id: number;
  type: WalletTransactionType;
  amount: string;
  reason: string | null;
  availableAt: string | null;
  createdAt: string;
};

export type ListWalletTransactionsParams = {
  page?: number;
  limit?: number;
};

export type WalletPayoutUpi = {
  upiVpa: string;
  accountHolderName: string;
};

export type WalletPayoutBank = {
  accountNumber: string;
  ifsc: string;
  bankName: string | null;
  accountHolderName: string;
};

export type WalletPayoutMethods = {
  preferredMethod: WalletWithdrawalMethod | null;
  upi: WalletPayoutUpi | null;
  bank: WalletPayoutBank | null;
};

export type CreateWalletWithdrawalPayload = {
  amount: number;
  method: WalletWithdrawalMethod;
  accountHolderName: string;
  upiVpa?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
};

export type WalletWithdrawalCustomer = {
  id: number;
  phone: string;
};

export type WalletWithdrawalListItem = {
  id: number;
  amount: string;
  method: WalletWithdrawalMethod;
  status: WalletWithdrawalStatus;
  accountHolderName: string;
  upiVpa: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankName: string | null;
  rejectionReason: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  customer?: WalletWithdrawalCustomer;
  customerId?: number;
};

export type WalletWithdrawalDetail = WalletWithdrawalListItem & {
  razorpayPayoutId?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
};

export type ListWalletWithdrawalsParams = {
  page?: number;
  limit?: number;
  status?: WalletWithdrawalStatus;
  customerId?: number;
};

export type RejectWalletWithdrawalPayload = {
  reason?: string;
};
