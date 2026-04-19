# Frontend Quick Reference

Quick lookup for common API endpoints and responses.

---

## 🔗 API Base URL

**Local**: `http://localhost:3000`
**Production**: `https://dotvests-backend.onrender.com`

---

## 🔐 Authentication

```bash
# Register
POST /api/auth/register
Body: { full_name, email, phone, password }
Returns: { token, user }

# Login
POST /api/auth/login
Body: { email, password }
Returns: { token, user }

# Get Current User
GET /api/auth/me
Auth: Required
Returns: { user }
```

---

## 👤 User Profile

```bash
# Get Profile
GET /api/user/profile
Auth: Required

# Update Profile
PATCH /api/user/profile
Auth: Required
Body: { full_name, phone, profile_image, date_of_birth, address }

# Submit KYC
POST /api/user/kyc
Auth: Required
Body: { bvn, nin, document_type, document_number }

# Get Notifications
GET /api/user/notifications
Auth: Required
Query: ?limit=20&offset=0

# Change Password
PATCH /api/user/change-password
Auth: Required
Body: { current_password, new_password }
```

---

## 💰 Wallet & Transactions

```bash
# Get Wallet
GET /api/wallet
Auth: Required
Returns: { balance, account_number, bank_name }

# Deposit
POST /api/wallet/deposit
Auth: Required
Body: { amount, payment_method }
Returns: { new_balance, reference, transaction }

# Withdraw
POST /api/wallet/withdraw
Auth: Required
Body: { amount, destination, account_number, account_name }
Returns: { new_balance, reference, status }

# Get Transactions
GET /api/wallet/transactions
Auth: Required
Query: ?type=all&limit=20&offset=0&start_date=2024-01-01&end_date=2024-12-31
Returns: { transactions, total_count }
```

---

## 📈 Stocks

```bash
# Get All Stocks
GET /api/stocks
Query: ?search=DTV&sector=Finance&limit=50&offset=0
Returns: { stocks[] }

# Get Single Stock
GET /api/stocks/:ticker
Returns: { stock with all details }

# Get Trending
GET /api/stocks/trending/list
Query: ?limit=10&offset=0
Returns: { trending[] }

# Add to Watchlist
POST /api/stocks/watchlist/add
Auth: Required
Body: { stock_id }

# Get Watchlist
GET /api/stocks/watchlist/me
Auth: Required
Returns: { watchlist[] }

# Remove from Watchlist
DELETE /api/stocks/watchlist/:stock_id
Auth: Required
```

---

## ⚡ Orders

```bash
# Place Order
POST /api/orders/place
Auth: Required
Body: { stock_id, type: "buy"|"sell", quantity, price, order_type }
Returns: { order with execution details }

# Get My Orders
GET /api/orders/my-orders
Auth: Required
Query: ?status=all&type=all&limit=50&offset=0
Returns: { orders[] }
```

---

## 📊 Portfolio

```bash
# Get Portfolio
GET /api/portfolio
Auth: Required
Returns: { summary, holdings[] }

# Get Performance
GET /api/portfolio/summary/performance
Auth: Required
Returns: { performance metrics }
```

---

## 🔑 Authentication Header

All protected endpoints require:

```
Authorization: Bearer {token}
```

Example:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not found |
| 500 | Server error |

---

## ⚠️ Error Response

```json
{
  "success": false,
  "message": "User-friendly message",
  "error": "Technical error"
}
```

---

## 💡 Common Tasks

### Register & Login

```javascript
// 1. Register
const register = async () => {
  const res = await fetch('https://api.../api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '08012345678',
      password: 'SecurePass123!'
    })
  });
  const data = await res.json();
  localStorage.setItem('token', data.token);
};

// 2. Login
const login = async () => {
  const res = await fetch('https://api.../api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'john@example.com',
      password: 'SecurePass123!'
    })
  });
  const data = await res.json();
  localStorage.setItem('token', data.token);
};
```

### Make Authenticated Request

```javascript
const token = localStorage.getItem('token');
const res = await fetch('https://api.../api/wallet', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await res.json();
```

### Place a Trade

```javascript
const placeOrder = async (stockId, quantity, price) => {
  const token = localStorage.getItem('token');
  const res = await fetch('https://api.../api/orders/place', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      stock_id: stockId,
      type: 'buy',
      quantity,
      price,
      order_type: 'market'
    })
  });
  return await res.json();
};
```

### Get Transactions with Filters

```javascript
const getTransactions = async (startDate, endDate) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    type: 'all',
    limit: 20,
    start_date: startDate,
    end_date: endDate
  });
  
  const res = await fetch(
    `https://api.../api/wallet/transactions?${params}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  return await res.json();
};
```

---

## 🧪 Testing Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@test.com",
    "phone": "08012345678",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "password123"
  }'

# Get Wallet (with token)
curl http://localhost:3000/api/wallet \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get Stocks
curl http://localhost:3000/api/stocks

# Place Order (with token)
curl -X POST http://localhost:3000/api/orders/place \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "stock_id": 1,
    "type": "buy",
    "quantity": 10,
    "price": 341.25,
    "order_type": "market"
  }'
```

### Using Postman

1. Set base URL: `http://localhost:3000`
2. Set environment variable: `{{token}}`
3. After login, add response token to environment: `pm.environment.set("token", pm.response.json().token)`
4. Use `Authorization` header: `Bearer {{token}}`

---

## 📱 Common Response Formats

### User Object

```json
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "profile_image": "https://...",
  "date_of_birth": "1990-01-15",
  "address": "123 Main St, Lagos",
  "kyc_status": "unverified",
  "account_status": "active",
  "role": "user",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Stock Object

```json
{
  "id": 1,
  "name": "DotVest",
  "ticker": "DTV",
  "price": 341.25,
  "change_amount": 113.20,
  "change_percent": 49.61,
  "sector": "Financial Technology",
  "pe_ratio": 15.5,
  "dividend_yield": 2.5
}
```

### Order Object

```json
{
  "id": 1,
  "stock_id": 1,
  "ticker": "DTV",
  "type": "buy",
  "quantity": 10,
  "price": 341.25,
  "total": 3412.50,
  "status": "completed",
  "commission": 34.13,
  "created_at": "2024-04-19T10:30:00Z"
}
```

### Transaction Object

```json
{
  "id": 1,
  "type": "deposit",
  "amount": 50000,
  "description": "Wallet deposit via bank transfer",
  "reference": "DEP-1234567890-1",
  "status": "completed",
  "created_at": "2024-04-19T10:30:00Z"
}
```

---

## 🚀 Rate Limits

- **Limit**: 100 requests per 15 minutes per IP
- **Header**: `X-RateLimit-Remaining`
- **Error**: 429 Too Many Requests

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All amounts are in Nigerian Naira (NGN)
- Prices are decimals (e.g., 341.25)
- Quantities are integers
- Token expires based on JWT_EXPIRES_IN (default 7 days)

---

**Version**: 1.0.0
**Last Updated**: April 2026
