# Wallet API

Customer referral wallet balances, ledger, and withdrawals via **UPI or bank (IMPS)** through RazorpayX (admin-approved).

[← Back to index](./README.md) · [Referrals](./referrals.md)

---

## Overview

- Each customer can have one `Wallet` with a running `balance`
- Referral commissions create `WalletTransaction` rows of type `CREDIT` with `reason = REFERRAL_COMMISSION`
- Login bonuses create `WalletTransaction` rows of type `CREDIT` with `reason = LOGIN_BONUS` (immediately available; not subject to hold days)
- One-time login bonus is configured in [site-settings.md](./site-settings.md) (`loginBonusIsActive`, `loginBonusAmount`; default amount **0**, inactive until admin sets both)
- On OTP verify, if the feature is on, amount &gt; 0, and `customer.loginBonusReceived` is false → credit and set the flag
- Staff can grant a missed bonus once via `POST /admin/wallets/:customerId/login-bonus` (uses current amount; ignores the active toggle; still one-time)
- **Checkout wallet redemption:** customer may send `walletAmount` on `POST /orders`. Caps: available balance, `walletRedemptionMaxAmount` (default ₹1000), merchandise after coupon, and min order `walletRedemptionMinOrderAmount` (default ₹10000). Stored as order/invoice `walletDiscountAmount`. Amount is **reserved** while the order is `PENDING` (counts against available balance). Ledger `DEBIT` with `reason = WALLET_DISCOUNT` runs on payment-success webhook; hold releases on payment failure. Full refund credits `WALLET_DISCOUNT_REFUND`.
- Credits set `availableAt = creditedAt + WALLET_CREDIT_HOLD_DAYS` (default **7 days**) for referral commissions; login bonus / wallet-discount refund use `availableAt = now`
- `availableBalance` = matured credits − debits − open withdrawals − **PENDING order wallet holds**. Login bonuses set `availableAt = now` so they are immediately withdrawable.
- Customers request withdrawals with `method: UPI | BANK`; staff must **approve** before RazorpayX payout
- Wallet `DEBIT` (`WITHDRAWAL`) is created only when the payout succeeds
- Preferred UPI and bank details are saved on the customer for reuse (`GET /users/me/wallet/payout-methods`)

### Env

| Env | Purpose |
|-----|---------|
| `WALLET_CREDIT_HOLD_DAYS` | Days before a credit is withdrawable (default `7`) |
| `RAZORPAYX_ACCOUNT_NUMBER` | RazorpayX source account / Customer Identifier for payouts |
| `RAZORPAYX_PAYOUTS_MOCK` | Set `true` locally to simulate successful payouts without RazorpayX |

### Testing payouts

Your Nest approve route is fine (`POST /api/v1/admin/wallet-withdrawals/:id/approve`). The error *"The requested URL was not found on the server"* comes from **Razorpay**, not Nest — Payment Gateway keys alone do not enable the Payouts API.

**Option A — local mock (fastest)**

```env
RAZORPAYX_PAYOUTS_MOCK=true
```

Restart the API, approve again. Withdrawal goes `SUCCESS` and wallet is debited with a fake `pout_mock_…` payout id. Do **not** enable this in production.

**Option B — real RazorpayX Test Mode**

1. Open [RazorpayX](https://x.razorpay.com) and activate / complete signup (business email; GST may be required).
2. Switch dashboard to **Test Mode**.
3. Generate **Test** API keys (same keys work for PG + X).
4. Banking → copy **Customer Identifier** / test account number into `RAZORPAYX_ACCOUNT_NUMBER`.
5. Add dummy test balance in X Test Mode.
6. Set `RAZORPAYX_PAYOUTS_MOCK=false`, restart, approve again.
7. In Test Mode, payouts often stay `processing` until you advance state on the X dashboard; webhooks can then mark `SUCCESS`.

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
| `GET /admin/wallets/:customerId/transactions` | No | `view-wallets` |
| `POST /admin/wallets/:customerId/login-bonus` | No | `update-wallets` |
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
| `GET` | `/api/v1/admin/wallets/:customerId/transactions` | Staff (`view-wallets`) | `200` |
| `POST` | `/api/v1/admin/wallets/:customerId/login-bonus` | Staff (`update-wallets`) | `200` |
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
  "pendingBalance": "500.00",
  "redemptionMaxAmount": "1000.00",
  "redemptionMinOrderAmount": "10000.00"
}
```

`redemptionMaxAmount` / `redemptionMinOrderAmount` come from admin site settings (for checkout UI validation).

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

### GET /api/v1/admin/wallets/:customerId

Returns wallet balances and customer payout prefs, including `loginBonusReceived` / `loginBonusReceivedAt`. If the customer has no wallet row yet, balances are `0.00` and `id` is `null`.

### GET /api/v1/admin/wallets/:customerId/transactions

Paginated wallet ledger for a customer (same item shape as `GET /users/me/wallet/transactions`). Query: `page`, `limit`.

| Status | When |
|--------|------|
| `200` | Ledger page (empty `items` if the customer has no wallet yet) |
| `404` | Customer not found |

```bash
curl "http://localhost:5000/api/v1/admin/wallets/1/transactions?page=1&limit=20" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

Example item reasons: `REFERRAL_COMMISSION`, `LOGIN_BONUS`, `WALLET_DISCOUNT`, `WALLET_DISCOUNT_REFUND`, `WITHDRAWAL`.

### POST /api/v1/admin/wallets/:customerId/login-bonus

Grants the **current** site-settings `loginBonusAmount` once to a customer who has not received it. Works even when `loginBonusIsActive` is false (recovery). Fails if amount is `0` or already claimed.

| Status | When |
|--------|------|
| `200` | Bonus credited |
| `400` | Amount not configured (still `0`) |
| `404` | Customer not found |
| `409` | Already received |

```bash
curl -X POST "http://localhost:5000/api/v1/admin/wallets/1/login-bonus" \
  -H "Authorization: Bearer $STAFF_TOKEN"
```

### POST .../approve

Branches on `method`: UPI composite payout or bank IMPS composite payout.

### POST .../reject

Body optional: `{ "reason": "Invalid details" }`.

---

## Webhooks

Same endpoint: `POST /api/v1/payments/webhooks/razorpay`.

Handled: `payout.processed`, `payout.updated` (when processed), `payout.failed`, `payout.rejected`.
