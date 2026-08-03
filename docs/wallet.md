# Wallet API

Customer referral wallet balances, ledger, and withdrawals via **UPI or bank (IMPS)** through RazorpayX (admin-approved).

[← Back to index](./README.md) · [Referrals](./referrals.md)

---

## Overview

- Each customer can have one `Wallet` with a running `balance`
- Referral commissions create `WalletTransaction` rows of type `CREDIT` with `reason = REFERRAL_COMMISSION`
- Credits set `availableAt = creditedAt + WALLET_CREDIT_HOLD_DAYS` (default **7 days**)
- `availableBalance` = matured credits − debits − open withdrawals (`PENDING` / `PROCESSING`)
- Customers request withdrawals with `method: UPI | BANK`; staff must **approve** before RazorpayX payout
- Wallet `DEBIT` (`WITHDRAWAL`) is created only when the payout succeeds
- Preferred UPI and bank details are saved on the customer for reuse (`GET /users/me/wallet/payout-methods`)

### Env

| Env | Purpose |
|-----|---------|
| `WALLET_CREDIT_HOLD_DAYS` | Days before a credit is withdrawable (default `7`) |
| `RAZORPAYX_ACCOUNT_NUMBER` | RazorpayX source account for payouts |

### Who can access?

| Endpoint | Customer | Staff |
|----------|:--------:|:-----:|
| `GET /users/me/wallet` | Yes | No |
| `GET /users/me/wallet/transactions` | Yes | No |
| `GET /users/me/wallet/payout-methods` | Yes | No |
| `POST /users/me/wallet/withdrawals` | Yes | No |
| `GET /users/me/wallet/withdrawals` | Yes | No |
| `GET /users/me/wallet/withdrawals/:id` | Yes | No |
| `GET /admin/wallets/:customerId` | No | `view-wallets` |
| `GET /admin/wallet-withdrawals` | No | `view-wallets` |
| `GET /admin/wallet-withdrawals/:id` | No | `view-wallets` |
| `POST /admin/wallet-withdrawals/:id/approve` | No | `update-wallets` |
| `POST /admin/wallet-withdrawals/:id/reject` | No | `update-wallets` |

---

## Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `GET` | `/api/v1/users/me/wallet` | Customer JWT | `200` |
| `GET` | `/api/v1/users/me/wallet/transactions` | Customer JWT | `200` |
| `GET` | `/api/v1/users/me/wallet/payout-methods` | Customer JWT | `200` |
| `POST` | `/api/v1/users/me/wallet/withdrawals` | Customer JWT | `201` |
| `GET` | `/api/v1/users/me/wallet/withdrawals` | Customer JWT | `200` |
| `GET` | `/api/v1/users/me/wallet/withdrawals/:id` | Customer JWT | `200` |
| `GET` | `/api/v1/admin/wallets/:customerId` | Staff (`view-wallets`) | `200` |
| `GET` | `/api/v1/admin/wallet-withdrawals` | Staff (`view-wallets`) | `200` |
| `GET` | `/api/v1/admin/wallet-withdrawals/:id` | Staff (`view-wallets`) | `200` |
| `POST` | `/api/v1/admin/wallet-withdrawals/:id/approve` | Staff (`update-wallets`) | `200` |
| `POST` | `/api/v1/admin/wallet-withdrawals/:id/reject` | Staff (`update-wallets`) | `200` |

---

## GET /api/v1/users/me/wallet

### Response

```json
{
  "balance": "500.00",
  "availableBalance": "0.00",
  "pendingBalance": "500.00"
}
```

---

## GET /api/v1/users/me/wallet/payout-methods

Saved preferences for form prefill.

```json
{
  "preferredMethod": "BANK",
  "upi": {
    "upiVpa": "rahul@upi",
    "accountHolderName": "Rahul Sharma"
  },
  "bank": {
    "accountNumber": "123456789012",
    "ifsc": "HDFC0001234",
    "bankName": "HDFC Bank",
    "accountHolderName": "Rahul Sharma"
  }
}
```

`upi` / `bank` are `null` until that method has been used at least once.

---

## POST /api/v1/users/me/wallet/withdrawals

### Rules

- Minimum amount: **₹100**
- Amount ≤ `availableBalance`
- Only **one** open request (`PENDING` or `PROCESSING`) at a time
- `method` required: `UPI` or `BANK`
- Updates preferred details for that method

### UPI example

```json
{
  "amount": 500,
  "method": "UPI",
  "accountHolderName": "Rahul Sharma",
  "upiVpa": "rahul@upi"
}
```

### Bank example

```json
{
  "amount": 500,
  "method": "BANK",
  "accountHolderName": "Rahul Sharma",
  "bankAccountNumber": "123456789012",
  "bankIfsc": "HDFC0001234",
  "bankName": "HDFC Bank"
}
```

| Field | Required when |
|-------|----------------|
| `upiVpa` | `method=UPI` |
| `bankAccountNumber` | `method=BANK` (6–18 digits) |
| `bankIfsc` | `method=BANK` (e.g. `HDFC0001234`) |
| `bankName` | optional |
| `accountHolderName` | always |

Bank payouts use RazorpayX **IMPS**.

### Response `201`

Includes `method` and destination fields. List endpoints mask `bankAccountNumber` as `****1234`; detail endpoints return the full number.

---

## Withdrawal statuses

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting admin review (reserves available balance) |
| `PROCESSING` | Approved; RazorpayX payout in flight |
| `SUCCESS` | Payout succeeded; wallet DEBIT recorded |
| `FAILED` | Payout failed; funds available again |
| `REJECTED` | Admin rejected; funds available again |

---

## Admin

### POST .../approve

Branches on `method`: UPI composite payout or bank IMPS composite payout.

### POST .../reject

Body optional: `{ "reason": "Invalid details" }`.

---

## Webhooks

Same endpoint: `POST /api/v1/payments/webhooks/razorpay`.

Handled: `payout.processed`, `payout.updated` (when processed), `payout.failed`, `payout.rejected`.
