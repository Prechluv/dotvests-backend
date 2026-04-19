# DotVests Backend Endpoints Specification

**Base URL:** `http://localhost:3000` (local) or `https://dotvests-backend.onrender.com` (prod)

---

## 🔐 **AUTHENTICATION** (Already Implemented)

### Register
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "09012345678",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "09012345678",
    "kyc_status": "unverified"
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "kyc_status": "unverified"
  }
}
```

### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "09012345678",
    "kyc_status": "unverified",
    "role": "user"
  }
}
```

---

## 👤 **USER PROFILE**

### Get User Profile
```
GET /api/user/profile
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "09012345678",
    "kyc_status": "unverified",
    "profile_image": "https://...",
    "date_of_birth": "1990-01-15",
    "address": "123 Main St, Lagos",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Update User Profile
```
PATCH /api/user/profile
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "full_name": "John Doe",
  "phone": "09012345678",
  "profile_image": "base64_or_url",
  "date_of_birth": "1990-01-15",
  "address": "123 Main St, Lagos"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ...updated user object }
}
```

### Submit KYC
```
POST /api/user/kyc
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "bvn": "12345678901",
  "nin": "12345678901",
  "document_type": "passport", // or "drivers_license", "national_id"
  "document_number": "A12345678"
}

Response:
{
  "success": true,
  "message": "KYC submitted successfully. Under review within 24-48 hours.",
  "kyc_status": "pending"
}
```

### Get Notifications
```
GET /api/user/notifications
Headers: Authorization: Bearer {token}

Query Parameters:
- limit: 20 (default)
- offset: 0 (default)

Response:
{
  "success": true,
  "unread_count": 3,
  "total_count": 15,
  "notifications": [
    {
      "id": 1,
      "title": "Deposit Successful",
      "message": "₦50,000 has been added to your wallet",
      "type": "deposit",
      "is_read": false,
      "created_at": "2024-04-19T10:30:00Z"
    }
  ]
}
```

### Change Password
```
PATCH /api/user/change-password
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 💰 **WALLET & TRANSACTIONS**

### Get Wallet Balance
```
GET /api/wallet
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "wallet": {
    "id": 1,
    "user_id": 1,
    "balance": 250000.50,
    "currency": "NGN",
    "account_number": "1234567890",
    "bank_name": "Access Bank",
    "updated_at": "2024-04-19T10:30:00Z"
  }
}
```

### Deposit Funds
```
POST /api/wallet/deposit
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "amount": 50000,
  "payment_method": "bank_transfer", // or "card", "ussd"
  "reference": "DEPOSIT_REF_12345" // optional, for external payments
}

Response:
{
  "success": true,
  "message": "₦50,000 deposited successfully",
  "new_balance": 300000.50,
  "reference": "DEP-1234567890-1",
  "transaction": {
    "id": 1,
    "type": "deposit",
    "amount": 50000,
    "status": "completed",
    "created_at": "2024-04-19T10:30:00Z"
  }
}
```

### Withdraw Funds
```
POST /api/wallet/withdraw
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "amount": 25000,
  "destination": "bank_account", // or "card"
  "account_number": "1234567890", // if bank transfer
  "account_name": "John Doe"
}

Response:
{
  "success": true,
  "message": "₦25,000 withdrawal initiated",
  "new_balance": 275000.50,
  "reference": "WDR-1234567890-1",
  "status": "processing", // will be "completed" in 1-3 days
  "transaction": {
    "id": 2,
    "type": "withdrawal",
    "amount": 25000,
    "status": "processing",
    "created_at": "2024-04-19T10:30:00Z"
  }
}
```

### Get Transaction History
```
GET /api/wallet/transactions
Headers: Authorization: Bearer {token}

Query Parameters:
- type: "all" (all|deposit|withdrawal|trade)
- limit: 20 (default)
- offset: 0 (default)
- start_date: "2024-01-01" (optional)
- end_date: "2024-12-31" (optional)

Response:
{
  "success": true,
  "count": 15,
  "transactions": [
    {
      "id": 1,
      "type": "deposit",
      "amount": 50000,
      "description": "Wallet deposit via bank transfer",
      "reference": "DEP-1234567890-1",
      "status": "completed",
      "created_at": "2024-04-19T10:30:00Z"
    },
    {
      "id": 2,
      "type": "trade",
      "amount": 5000,
      "description": "Bought 10 shares of DTV at ₦500",
      "reference": "BUY-1234567890-1",
      "status": "completed",
      "created_at": "2024-04-18T14:20:00Z"
    }
  ]
}
```

---

## 📈 **STOCKS & MARKETS**

### Get All Stocks
```
GET /api/stocks
Headers: Authorization: Bearer {token} (optional)

Query Parameters:
- search: "DTV" (optional, search by name or ticker)
- sector: "Financial Technology" (optional)
- limit: 50
- offset: 0

Response:
{
  "success": true,
  "count": 4,
  "stocks": [
    {
      "id": 1,
      "name": "DotVest",
      "ticker": "DTV",
      "price": 341.25,
      "previous_price": 228.05,
      "high_52w": 500.00,
      "low_52w": 200.00,
      "market_cap": "₦34.1B",
      "sector": "Financial Technology",
      "industry": "Digital Finance",
      "pe_ratio": 15.5,
      "dividend_yield": 2.5,
      "volume": "2.5M",
      "exchange": "NGX"
    }
  ]
}
```

### Get Single Stock Details
```
GET /api/stocks/:ticker
Headers: Authorization: Bearer {token} (optional)

Example: GET /api/stocks/DTV

Response:
{
  "success": true,
  "stock": {
    "id": 1,
    "name": "DotVest",
    "ticker": "DTV",
    "price": 341.25,
    "previous_price": 228.05,
    "change_amount": 113.20,
    "change_percent": 49.61,
    "high_52w": 500.00,
    "low_52w": 200.00,
    "open": 340.00,
    "high": 345.50,
    "low": 338.00,
    "market_cap": "₦34.1B",
    "shares_outstanding": 100000000,
    "sector": "Financial Technology",
    "industry": "Digital Finance",
    "description": "Africa's blockchain-powered stock exchange",
    "pe_ratio": 15.5,
    "eps": 22.08,
    "dividend_yield": 2.5,
    "beta": 1.2,
    "volume": "2500000",
    "average_volume": "1800000",
    "exchange": "NGX"
  }
}
```

### Add to Watchlist
```
POST /api/stocks/watchlist/add
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "stock_id": 1
}

Response:
{
  "success": true,
  "message": "Added to watchlist"
}
```

### Get My Watchlist
```
GET /api/stocks/watchlist/me
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 3,
  "watchlist": [
    {
      "id": 1,
      "name": "DotVest",
      "ticker": "DTV",
      "price": 341.25,
      "change_percent": 49.61,
      "added_at": "2024-04-15T10:30:00Z"
    }
  ]
}
```

### Remove from Watchlist
```
DELETE /api/stocks/watchlist/:stock_id
Headers: Authorization: Bearer {token}

Example: DELETE /api/stocks/watchlist/1

Response:
{
  "success": true,
  "message": "Removed from watchlist"
}
```

---

## ⚡ **TRADING - ORDERS**

### Place Order (Buy/Sell)
```
POST /api/orders/place
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request - BUY:
{
  "stock_id": 1,
  "type": "buy",
  "quantity": 10,
  "price": 341.25,
  "order_type": "market" // or "limit"
}

Request - SELL:
{
  "stock_id": 1,
  "type": "sell",
  "quantity": 5,
  "price": 350.00,
  "order_type": "market"
}

Response:
{
  "success": true,
  "message": "BUY order executed successfully",
  "order": {
    "id": 1,
    "stock_id": 1,
    "stock_name": "DotVest",
    "ticker": "DTV",
    "type": "buy",
    "quantity": 10,
    "price": 341.25,
    "total": 3412.50,
    "status": "completed",
    "execution_price": 341.25,
    "commission": 34.13,
    "net_cost": 3446.63,
    "created_at": "2024-04-19T10:30:00Z"
  }
}
```

### Get My Orders
```
GET /api/orders/my-orders
Headers: Authorization: Bearer {token}

Query Parameters:
- status: "all" (all|pending|completed|cancelled)
- type: "all" (all|buy|sell)
- limit: 50
- offset: 0

Response:
{
  "success": true,
  "count": 3,
  "orders": [
    {
      "id": 1,
      "stock_name": "DotVest",
      "ticker": "DTV",
      "type": "buy",
      "quantity": 10,
      "price": 341.25,
      "total": 3412.50,
      "status": "completed",
      "created_at": "2024-04-19T10:30:00Z"
    }
  ]
}
```

---

## 📊 **PORTFOLIO**

### Get Full Portfolio
```
GET /api/portfolio
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "summary": {
    "total_current_value": 50000.00,
    "total_invested": 45000.00,
    "total_profit_loss": 5000.00,
    "total_profit_loss_percent": "11.11",
    "number_of_holdings": 3
  },
  "holdings": [
    {
      "id": 1,
      "stock_id": 1,
      "stock_name": "DotVest",
      "ticker": "DTV",
      "quantity": 10,
      "average_cost": 228.05,
      "current_price": 341.25,
      "total_invested": 2280.50,
      "current_value": 3412.50,
      "profit_loss": 1132.00,
      "profit_loss_percent": 49.61,
      "last_updated": "2024-04-19T10:30:00Z"
    }
  ]
}
```

### Get Portfolio Performance Summary (BROKEN - FIX FIRST)
```
GET /api/portfolio/summary/performance
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "performance": {
    "wallet_balance": 100000.00,
    "portfolio_value": 50000.00,
    "total_assets": 150000.00,
    "total_trades": 15,
    "total_invested": 45000.00,
    "this_month_profit_loss": 5000.00,
    "this_month_profit_loss_percent": "11.11"
  }
}
```

---

## 🔥 **TRENDING INVESTMENTS** (NEW - TO BE CREATED)

### Get Trending Investments
```
GET /api/stocks/trending
Headers: Authorization: Bearer {token} (optional)

Query Parameters:
- limit: 10
- offset: 0

Response:
{
  "success": true,
  "count": 4,
  "trending": [
    {
      "id": 1,
      "name": "DotVest",
      "ticker": "DTV",
      "subtitle": "Blockchain-powered stock exchange",
      "expected_apy": 15.5,
      "risk_level": "high", // low|medium|high
      "min_investment": 50000,
      "current_price": 341.25,
      "icon": "DTV", // or emoji code
      "description": "Invest in Africa's leading fintech platform"
    }
  ]
}
```

---

## 📝 **NOTES FOR BACKEND**

1. **All protected endpoints** require:
   - `Authorization: Bearer {token}` header
   - Token from login/register response

2. **All responses** should follow this format:
   ```json
   {
     "success": true/false,
     "message": "optional message",
     "data": {} or []
   }
   ```

3. **Error responses** should be:
   ```json
   {
     "success": false,
     "message": "Error description",
     "error_code": "SPECIFIC_ERROR"
   }
   ```

4. **HTTP Status Codes:**
   - 200 OK
   - 201 Created
   - 400 Bad Request
   - 401 Unauthorized
   - 403 Forbidden
   - 404 Not Found
   - 500 Server Error

5. **FIX FIRST:** The `/api/portfolio/summary/performance` endpoint has SQL error with "buy" column. Review the query.

---

**Frontend Ready:** Mobile app is ready to integrate these endpoints with React Query once they're implemented.
