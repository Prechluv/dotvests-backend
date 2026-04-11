# DotVests Backend - Setup & Installation Guide

## Project Overview
**DotVests** is a Node.js/Express-based stock trading platform with blockchain integration (ZetaChain), payment processing (Paystack), and email notifications (SendGrid).

## Technology Stack
- **Framework**: Express.js 5.2.1
- **Database**: SQLite with better-sqlite3 (synchronous)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Security**: Helmet, CORS, Rate Limiting
- **Blockchain**: ethers.js (ZetaChain Athens Testnet)
- **Payment Gateway**: Paystack API
- **Email Service**: SendGrid
- **HTTP Client**: Axios

## Installation & Setup

### 1. Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Git

### 2. Install Dependencies
```bash
npm install
```

This will install all packages from `package.json`:
- express (web framework)
- cors (cross-origin requests)
- helmet (security headers)
- express-rate-limit (API rate limiting)
- dotenv (environment variables)
- jsonwebtoken (JWT auth)
- bcryptjs (password hashing)
- better-sqlite3 (SQLite database)
- ethers (blockchain interaction)
- axios (HTTP requests)
- @sendgrid/mail (email sending)

### 3. Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3000

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Database
# No setup needed - SQLite auto-creates db/dotvests.db

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@dotvests.com
FRONTEND_URL=http://localhost:3000

# Payment (Paystack)
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# Blockchain (ZetaChain)
PRIVATE_KEY=your_wallet_private_key
PLATFORM_WALLET=0x_platform_wallet_address
DTV_CONTRACT=0x_dtv_contract_address
TEL_CONTRACT=0x_tel_contract_address
ORB_CONTRACT=0x_orb_contract_address
CEM_CONTRACT=0x_cem_contract_address
```

### 4. Run the Server
```bash
node index.js
```

Server will start on `http://localhost:3000` (or your configured PORT)

## Database Schema

### Tables
- **users** - User accounts with KYC data
- **wallets** - User wallet balances
- **transactions** - Deposit/withdrawal/trade history
- **stocks** - Available stocks for trading
- **watchlists** - User's stock watchlists
- **orders** - Buy/sell orders
- **portfolio** - User's stock holdings
- **notifications** - User notifications

All tables are auto-created on first run.

## API Documentation

### Base URL
```
http://localhost:3000/api
```

---

## ENDPOINTS

### 1. AUTHENTICATION (`/api/auth`)

#### Register
- **POST** `/auth/register`
- **Body**: `{ full_name, email, phone?, password }`
- **Returns**: JWT token + user data
- **No auth required**

#### Login
- **POST** `/auth/login`
- **Body**: `{ email, password }`
- **Returns**: JWT token + user data
- **No auth required**

#### Get Current User
- **GET** `/auth/me`
- **Returns**: User profile (ID, name, email, phone, KYC status, role)
- **Requires**: Bearer token

#### Forgot Password
- **POST** `/auth/forgot-password`
- **Body**: `{ email }`
- **Sends**: Password reset link via email
- **Returns**: Success message (doesn't reveal if email exists)
- **No auth required**

#### Reset Password
- **POST** `/auth/reset-password`
- **Body**: `{ token, new_password }`
- **Returns**: Success message
- **Note**: Token expires in 1 hour
- **No auth required**

---

### 2. USER PROFILE (`/api/user`)
*All endpoints require Bearer token*

#### Get Profile
- **GET** `/user/profile`
- **Returns**: Full user details including KYC status

#### Update Profile
- **PATCH** `/user/profile`
- **Body**: `{ full_name, phone }`
- **Returns**: Success message

#### Submit KYC
- **POST** `/user/kyc`
- **Body**: `{ bvn, nin }`
- **Returns**: Success message
- **Note**: Sets kyc_status to 'pending' (requires admin approval)

#### Get Notifications
- **GET** `/user/notifications`
- **Returns**: Array of notifications with unread count

#### Mark Notification as Read
- **PATCH** `/user/notifications/:id`
- **Returns**: Success message

#### Mark All Notifications as Read
- **PATCH** `/user/notifications`
- **Returns**: Success message

#### Change Password
- **PATCH** `/user/change-password`
- **Body**: `{ current_password, new_password }`
- **Returns**: Success message

---

### 3. STOCKS (`/api/stocks`)

#### Get All Active Stocks
- **GET** `/stocks`
- **Returns**: Array of all active stocks
- **No auth required**

#### Get Single Stock
- **GET** `/stocks/:ticker`
- **Params**: ticker (e.g., "AAPL")
- **Returns**: Stock details
- **No auth required**

#### Add Stock to Watchlist
- **POST** `/stocks/watchlist/add`
- **Body**: `{ stock_id }`
- **Requires**: Bearer token
- **Returns**: Success message

#### Get My Watchlist
- **GET** `/stocks/watchlist/me`
- **Requires**: Bearer token
- **Returns**: Array of stocks in user's watchlist

#### Remove Stock from Watchlist
- **DELETE** `/stocks/watchlist/:stock_id`
- **Requires**: Bearer token
- **Returns**: Success message

#### Add New Stock (Admin Only)
- **POST** `/stocks/admin/add`
- **Body**: `{ name, ticker, sector?, price, logo?, description? }`
- **Requires**: Bearer token + Admin role
- **Returns**: Success + stock_id

#### Update Stock Price (Admin Only)
- **PATCH** `/stocks/admin/price/:id`
- **Body**: `{ price }`
- **Requires**: Bearer token + Admin role
- **Returns**: Old and new price comparison

---

### 4. ORDERS (`/api/orders`)
*All endpoints require Bearer token*

#### Place Order (Buy/Sell)
- **POST** `/orders/place`
- **Body**: `{ stock_id, type ('buy'|'sell'), quantity, price }`
- **Returns**: Order confirmation with blockchain tx hash
- **Logic**:
  - **BUY**: Deducts from wallet, updates portfolio, mints blockchain tokens
  - **SELL**: Adds to wallet, updates portfolio, burns blockchain tokens

#### Get My Order History
- **GET** `/orders/my-orders`
- **Returns**: Array of user's orders (buy/sell)

#### Get Single Order
- **GET** `/orders/:id`
- **Returns**: Order details with stock information

---

### 5. WALLET (`/api/wallet`)
*All endpoints require Bearer token*

#### Get Wallet Balance
- **GET** `/wallet`
- **Returns**: Wallet balance and currency

#### Deposit Funds (Direct)
- **POST** `/wallet/deposit`
- **Body**: `{ amount }`
- **Returns**: New balance + transaction reference
- **Note**: Direct deposit without payment gateway

#### Withdraw Funds
- **POST** `/wallet/withdraw`
- **Body**: `{ amount }`
- **Returns**: New balance + transaction reference
- **Checks**: Sufficient balance

#### Get Transaction History
- **GET** `/wallet/transactions`
- **Returns**: Array of deposits, withdrawals, trades

---

### 6. PAYMENTS (`/api/payment`)
*Paystack Integration*

#### Initialize Payment
- **POST** `/payment/initialize`
- **Body**: `{ amount }`
- **Requires**: Bearer token
- **Minimum**: ₦100
- **Returns**: Paystack authorization URL + access code + reference
- **Note**: Client redirects user to authorization_url

#### Verify Payment
- **GET** `/payment/verify/:reference`
- **Requires**: Bearer token
- **Returns**: Success status + new wallet balance
- **Note**: Called after Paystack redirects back

#### Webhook (Paystack)
- **POST** `/payment/webhook`
- **No auth required**
- **Note**: Paystack sends charge.success event here
- **Signature**: Verified with PAYSTACK_SECRET_KEY

---

### 7. PORTFOLIO (`/api/portfolio`)
*All endpoints require Bearer token*

#### Get Full Portfolio
- **GET** `/portfolio`
- **Returns**: Holdings with profit/loss calculations
- **Includes**:
  - Current value per holding
  - Cost basis
  - Profit/loss (absolute + percentage)
  - Portfolio summary (total value, total P&L)

#### Get Single Holding
- **GET** `/portfolio/:stock_id`
- **Returns**: Details for one stock holding

#### Get Portfolio Performance Summary
- **GET** `/portfolio/summary/performance`
- **Returns**:
  - Wallet balance
  - Portfolio value
  - Total assets (wallet + portfolio)
  - Total trades, investments, sales

---

### 8. ADMIN (`/api/admin`)
*All endpoints require Bearer token + Admin role*

#### Get All Users
- **GET** `/admin/users`
- **Returns**: List of all users (excluding passwords)

#### Get Single User Details
- **GET** `/admin/users/:id`
- **Returns**: User info, wallet, total orders

#### Approve KYC
- **PATCH** `/admin/kyc/approve/:id`
- **Returns**: Success message
- **Note**: Sets kyc_status to 'verified', sends notification

#### Reject KYC
- **PATCH** `/admin/kyc/reject/:id`
- **Body**: `{ reason? }`
- **Returns**: Success message
- **Note**: Sets kyc_status to 'rejected', sends notification with reason

#### Suspend User
- **PATCH** `/admin/users/suspend/:id`
- **Returns**: Success message
- **Note**: Prevents suspended users from logging in

#### Activate User
- **PATCH** `/admin/users/activate/:id`
- **Returns**: Success message
- **Note**: Reactivates a suspended account

#### Get Platform Statistics
- **GET** `/admin/stats`
- **Returns**: 
  - User counts (total, verified, pending KYC)
  - Trading stats (total orders, buy/sell volumes)
  - Financial stats (deposits, withdrawals, wallet balance)
  - Platform stats (active stocks)

---

## Response Format

All endpoints return JSON with standard format:

**Success**:
```json
{
  "success": true,
  "message": "Action completed",
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical error details"
}
```

## Authentication
Include JWT token in request headers:
```
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applies to**: All endpoints

## CORS
- **Origins**: All (*) - Can be restricted to specific domains
- **Methods**: GET, POST, PATCH, DELETE
- **Headers**: Content-Type, Authorization

## Security Features
- Helmet.js (XSS, clickjacking protection)
- CORS validation
- Rate limiting
- Password hashing (bcryptjs)
- JWT token verification
- Admin role authorization

