# Paystack Payment Integration Guide

## Overview

This guide covers the complete Paystack payment integration for DotVests. Users can fund their wallet via Nigerian bank transfers using Paystack's payment gateway. Withdrawals are handled separately through Polymesh.

---

## Setup Instructions

### 1. Get Your Paystack Keys

1. Create a Paystack account at https://paystack.com
2. Navigate to **Settings → API Keys & Webhooks**
3. Copy your **Secret Key** and **Public Key**

### 2. Configure Environment Variables

In your `.env` file, add:

```env
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
```

### 3. Configure Webhook

In Paystack Dashboard:

1. Go to **Settings → API Keys & Webhooks**
2. Set **Webhook URL** to: `https://dotvests.com/api/payment/webhook` (or your domain)
3. Test the webhook from the dashboard
4. Enable the webhook

The webhook automatically credits wallets when payments succeed.

---

## API Endpoints

### 1. Initialize Payment

**Endpoint:** `POST /api/payment/initialize`

**Authentication:** Required (Bearer token)

**Description:** Create a payment session and get a redirect URL for the user.

**Request Body:**
```json
{
  "amount": 50000
}
```

**Request Fields:**
| Field | Type | Min/Max | Description |
|-------|------|---------|-------------|
| amount | number | ≥100 | Amount in Naira (NGN) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment initialized",
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "xxxxx",
    "reference": "1234567890",
    "amount": 50000
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Minimum deposit is N100"
}
```

**Frontend Usage (React):**
```javascript
async function initializePayment(amount) {
  const response = await fetch('https://dotvests.com/api/payment/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  });

  const data = await response.json();

  if (data.success) {
    // Redirect to Paystack checkout
    window.location.href = data.data.authorization_url;
  }
}
```

**Frontend Usage (React with Paystack SDK):**
```javascript
import { usePaystackPayment } from 'react-paystack';

function DepositForm() {
  const config = {
    reference: paymentReference,
    email: userEmail,
    amount: amount * 100, // in kobo
    publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button onClick={() => initializePayment()}>
      Pay with Paystack
    </button>
  );
}
```

---

### 2. Verify Payment

**Endpoint:** `GET /api/payment/verify/:reference`

**Authentication:** Required (Bearer token)

**Description:** Verify a payment and credit the wallet if successful.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| reference | Paystack reference from initialize response |

**Success Response (200):**
```json
{
  "success": true,
  "message": "₦50,000.00 deposited successfully",
  "new_balance": 125000.50
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Transaction already processed"
}
```

**Frontend Usage:**
```javascript
async function verifyPayment(reference) {
  const response = await fetch(`https://dotvests.com/api/payment/verify/${reference}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (data.success) {
    alert(`Payment successful! New balance: ₦${data.new_balance}`);
    updateWalletBalance(data.new_balance);
  }
}

// Call this after Paystack redirects back to your app
const reference = new URLSearchParams(window.location.search).get('reference');
if (reference) {
  verifyPayment(reference);
}
```

---

### 3. Get Banks List

**Endpoint:** `GET /api/payment/banks`

**Authentication:** Not required

**Description:** Fetch list of Nigerian banks for KYC or profile setup.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Banks retrieved successfully",
  "data": [
    {
      "id": 1,
      "code": "044",
      "name": "Access Bank"
    },
    {
      "id": 2,
      "code": "050",
      "name": "Eco Bank"
    }
  ],
  "count": 35
}
```

**Frontend Usage (React):**
```javascript
function BankSelector() {
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    fetch('https://dotvests.com/api/payment/banks')
      .then(res => res.json())
      .then(data => setBanks(data.data));
  }, []);

  return (
    <select>
      {banks.map(bank => (
        <option key={bank.code} value={bank.code}>
          {bank.name}
        </option>
      ))}
    </select>
  );
}
```

---

## Payment Flow

### Complete User Journey

```
1. User clicks "Fund Wallet"
   ↓
2. Frontend calls POST /api/payment/initialize
   ↓
3. Backend returns authorization_url
   ↓
4. User redirected to Paystack checkout
   ↓
5. User enters bank details
   ↓
6. User authorizes payment
   ↓
7. Paystack sends webhook to backend
   ↓
8. Backend processes charge.success event
   ↓
9. Wallet balance credited automatically
   ↓
10. User redirected back to app (success page)
```

### Webhook Flow (Automatic)

When a payment succeeds, Paystack automatically sends a webhook:

```json
POST /api/payment/webhook

{
  "event": "charge.success",
  "data": {
    "reference": "1234567890",
    "amount": 5000000, // in kobo
    "metadata": {
      "user_id": 1,
      "full_name": "John Doe"
    }
  }
}
```

Backend automatically:
- Verifies the HMAC signature
- Credits the wallet
- Creates a success notification
- Prevents duplicate processing

---

## Security Features

### 1. HMAC Signature Verification
- Every webhook is verified using HMAC-SHA512
- Prevents spoofed webhooks from fake sources
- Implemented in `/api/payment/webhook`

### 2. Database Transactions
- Wallet credit and transaction status update are atomic
- Prevents race conditions if multiple webhooks arrive simultaneously
- No double-crediting possible

### 3. Idempotency
- If the same webhook is delivered twice, it's processed only once
- Checked via `reference` uniqueness in transactions table

### 4. Rate Limiting
- Webhook endpoint is excluded from rate limiter
- Allows Paystack to retry without being blocked

---

## Testing

### Paystack Test Mode

Use test keys during development:

```env
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
```

**Test card numbers:**
| Card Number | Expiry | CVC |
|-------------|--------|-----|
| 4084084084084081 | any future date | any 3 digits |
| 5399819860000015 | any future date | any 3 digits |

### Test Webhook Delivery

1. Go to Paystack Dashboard → Settings
2. Click "Webhooks"
3. Find your URL
4. Click "Send Test Event"
5. Select `charge.success`
6. Backend should automatically credit the test account

### Manual Testing

```bash
# 1. Register and login
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "08012345678",
    "password": "TestPass123!"
  }'

# 2. Login to get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123!"}' \
  | jq -r '.token')

# 3. Initialize payment
curl -X POST http://localhost:3000/api/payment/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 50000}'

# 4. Send test webhook (from Paystack dashboard)

# 5. Verify balance was updated
curl -X GET http://localhost:3000/api/wallet \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### Issue: Webhook not being received

**Cause:** Webhook URL not configured or doesn't match your domain

**Fix:**
1. Check Paystack Dashboard → Settings → Webhooks
2. Ensure URL matches your domain exactly: `https://dotvests.com/api/payment/webhook`
3. Ensure HTTPS is used (not HTTP)
4. Test webhook from dashboard

### Issue: HMAC signature mismatch

**Cause:** The webhook is being processed with parsed JSON instead of raw bytes

**Fix:** (Already fixed in this codebase)
- The webhook handler uses `express.raw()` to receive raw body bytes
- HMAC is computed on exact raw bytes before JSON parsing

### Issue: Duplicate wallet credits

**Cause:** Multiple webhook deliveries or race condition

**Fix:** (Already fixed in this codebase)
- All database operations are wrapped in `db.transaction()`
- Duplicate reference checks prevent double-crediting

### Issue: Payment stuck in pending

**Cause:** Verify endpoint wasn't called, or webhook wasn't delivered

**Fix:**
1. Call `GET /api/payment/verify/{reference}` manually
2. Check Paystack dashboard for delivery logs
3. Re-send webhook from dashboard

---

## Production Checklist

- [ ] Switch to live Paystack keys (`sk_live_...`, `pk_live_...`)
- [ ] Update webhook URL to production domain in Paystack dashboard
- [ ] Test a real payment with small amount (N50-100)
- [ ] Monitor webhook logs: `tail -f /var/log/app.log | grep "Webhook"`
- [ ] Set up email alerts for failed webhooks
- [ ] Test refund flow (if implemented)
- [ ] Document bank transfer limits with Paystack support
- [ ] Enable webhook retries in Paystack dashboard (default is 5 retries)

---

## API Reference Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/payment/initialize` | Yes | Start payment |
| GET | `/api/payment/verify/:ref` | Yes | Confirm payment |
| GET | `/api/payment/banks` | No | List banks |
| POST | `/api/payment/webhook` | No* | Webhook receiver |

*Webhook uses HMAC signature verification instead of auth tokens

---

## Support

- **Paystack Support:** https://support.paystack.com
- **Paystack Documentation:** https://paystack.com/docs
- **API Status:** https://status.paystack.com
