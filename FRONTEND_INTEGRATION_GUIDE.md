# DotVests Frontend Integration Guide

Complete documentation for frontend developers integrating with the DotVests backend API.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Base URLs](#api-base-urls)
4. [Request/Response Format](#requestresponse-format)
5. [Detailed Endpoints](#detailed-endpoints)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)

---

## 🚀 Getting Started

### Prerequisites
- React Native / React web app
- HTTP client library (Axios, Fetch, React Query)
- State management (Redux, Context API, Zustand)
- JWT token storage (Secure Storage for mobile)

### Installation

```bash
# For React Native
npm install axios react-query @react-native-async-storage/async-storage

# For React Web
npm install axios react-query
```

### Quick Setup

```javascript
// api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://dotvests-backend.onrender.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to every request
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

---

## 🔐 Authentication

### Register (Create Account)

**Endpoint**: `POST /api/auth/register`

```javascript
const register = async (userData) => {
  try {
    const response = await client.post('/api/auth/register', {
      full_name: "John Doe",
      email: "john@example.com",
      phone: "08012345678",
      password: "SecurePass123!"
    });
    
    // Save token
    await AsyncStorage.setItem('auth_token', response.data.token);
    
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response.data);
  }
};
```

**Request Body**:
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "password": "SecurePass123!"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "kyc_status": "unverified"
  }
}
```

---

### Login

**Endpoint**: `POST /api/auth/login`

```javascript
const login = async (email, password) => {
  try {
    const response = await client.post('/api/auth/login', {
      email,
      password
    });
    
    await AsyncStorage.setItem('auth_token', response.data.token);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
```

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "kyc_status": "unverified",
    "account_status": "active",
    "role": "user"
  }
}
```

---

### Get Current User

**Endpoint**: `GET /api/auth/me`

```javascript
const getCurrentUser = async () => {
  const response = await client.get('/api/auth/me');
  return response.data.user;
};
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "kyc_status": "unverified",
    "role": "user"
  }
}
```

---

## 📍 API Base URLs

| Environment | URL |
|-------------|-----|
| **Local Development** | `http://localhost:3000` |
| **Production (Render)** | `https://dotvests-backend.onrender.com` |

---

## 📤 Request/Response Format

### Standard Response Format

**Success Response**:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical error details"
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input - check validation |
| 401 | Unauthorized | Missing/invalid token - re-login |
| 403 | Forbidden | Permission denied |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Retry or contact support |

---

## 🔌 Detailed Endpoints

### 👤 USER PROFILE

#### Get Profile
```javascript
// GET /api/user/profile
const getProfile = async () => {
  const response = await client.get('/api/user/profile');
  return response.data.user;
};

// Response
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "profile_image": "https://...",
  "date_of_birth": "1990-01-15",
  "address": "123 Main St, Lagos",
  "kyc_status": "unverified",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Update Profile
```javascript
// PATCH /api/user/profile
const updateProfile = async (updates) => {
  const response = await client.patch('/api/user/profile', {
    full_name: "Jane Doe",
    phone: "09012345678",
    profile_image: "base64_string_or_url",
    date_of_birth: "1990-01-15",
    address: "456 New St, Lagos"
  });
  return response.data.user;
};

// Request body - all fields optional
{
  "full_name": "Jane Doe",
  "phone": "09012345678",
  "profile_image": "https://example.com/image.jpg",
  "date_of_birth": "1990-01-15",
  "address": "456 New St, Lagos"
}

// Response (201 Created)
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ...updated user object }
}
```

#### Submit KYC
```javascript
// POST /api/user/kyc
const submitKYC = async (kycData) => {
  const response = await client.post('/api/user/kyc', {
    bvn: "12345678901",
    nin: "12345678901",
    document_type: "passport",
    document_number: "A12345678"
  });
  return response.data;
};

// Request body
{
  "bvn": "12345678901",
  "nin": "12345678901",
  "document_type": "passport", // or "drivers_license", "national_id"
  "document_number": "A12345678"
}

// Response (200 OK)
{
  "success": true,
  "message": "KYC submitted successfully. Under review within 24-48 hours.",
  "kyc_status": "pending"
}
```

#### Change Password
```javascript
// PATCH /api/user/change-password
const changePassword = async (currentPassword, newPassword) => {
  const response = await client.patch('/api/user/change-password', {
    current_password: currentPassword,
    new_password: newPassword
  });
  return response.data;
};

// Request body
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!"
}

// Response (200 OK)
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Get Notifications
```javascript
// GET /api/user/notifications?limit=20&offset=0
const getNotifications = async (limit = 20, offset = 0) => {
  const response = await client.get('/api/user/notifications', {
    params: { limit, offset }
  });
  return response.data;
};

// Response (200 OK)
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

---

### 💰 WALLET

#### Get Wallet Balance
```javascript
// GET /api/wallet
const getWallet = async () => {
  const response = await client.get('/api/wallet');
  return response.data.wallet;
};

// Response
{
  "id": 1,
  "user_id": 1,
  "balance": 250000.50,
  "currency": "NGN",
  "account_number": "1234567890",
  "bank_name": "Access Bank",
  "updated_at": "2024-04-19T10:30:00Z"
}
```

#### Deposit Funds
```javascript
// POST /api/wallet/deposit
const deposit = async (amount, paymentMethod = "bank_transfer") => {
  const response = await client.post('/api/wallet/deposit', {
    amount,
    payment_method: paymentMethod
  });
  return response.data;
};

// Request body
{
  "amount": 50000,
  "payment_method": "bank_transfer" // or "card", "ussd"
}

// Response (201 Created)
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

#### Withdraw Funds
```javascript
// POST /api/wallet/withdraw
const withdraw = async (amount, destination, accountNumber, accountName) => {
  const response = await client.post('/api/wallet/withdraw', {
    amount,
    destination, // "bank_account" or "card"
    account_number: accountNumber,
    account_name: accountName
  });
  return response.data;
};

// Request body
{
  "amount": 25000,
  "destination": "bank_account",
  "account_number": "1234567890",
  "account_name": "John Doe"
}

// Response (201 Created)
{
  "success": true,
  "message": "₦25,000 withdrawal initiated",
  "new_balance": 275000.50,
  "reference": "WDR-1234567890-1",
  "status": "processing",
  "transaction": {
    "id": 2,
    "type": "withdrawal",
    "amount": 25000,
    "status": "processing",
    "created_at": "2024-04-19T10:30:00Z"
  }
}
```

#### Get Transaction History
```javascript
// GET /api/wallet/transactions?type=all&limit=20&offset=0&start_date=2024-01-01&end_date=2024-12-31
const getTransactions = async (filters = {}) => {
  const response = await client.get('/api/wallet/transactions', {
    params: {
      type: filters.type || 'all', // all|deposit|withdrawal|trade
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      start_date: filters.start_date,
      end_date: filters.end_date
    }
  });
  return response.data;
};

// Response (200 OK)
{
  "success": true,
  "count": 2,
  "total_count": 15,
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
      "type": "withdrawal",
      "amount": 10000,
      "description": "Withdrawal to John Doe (1234567890)",
      "reference": "WDR-1234567890-1",
      "status": "processing",
      "created_at": "2024-04-18T14:20:00Z"
    }
  ]
}
```

---

### 📈 STOCKS

#### Get All Stocks
```javascript
// GET /api/stocks?search=DTV&sector=Financial%20Technology&limit=50&offset=0
const getStocks = async (filters = {}) => {
  const response = await client.get('/api/stocks', {
    params: {
      search: filters.search,
      sector: filters.sector,
      limit: filters.limit || 50,
      offset: filters.offset || 0
    }
  });
  return response.data.stocks;
};

// Response (200 OK)
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

#### Get Single Stock Details
```javascript
// GET /api/stocks/DTV
const getStockDetails = async (ticker) => {
  const response = await client.get(`/api/stocks/${ticker}`);
  return response.data.stock;
};

// Response (200 OK)
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

#### Get Trending Stocks
```javascript
// GET /api/stocks/trending/list?limit=10&offset=0
const getTrendingStocks = async (limit = 10, offset = 0) => {
  const response = await client.get('/api/stocks/trending/list', {
    params: { limit, offset }
  });
  return response.data.trending;
};

// Response (200 OK)
{
  "success": true,
  "count": 4,
  "trending": [
    {
      "id": 1,
      "name": "DotVest",
      "ticker": "DTV",
      "expected_apy": 15.5,
      "risk_level": "high",
      "min_investment": 50000,
      "current_price": 341.25,
      "icon": "DTV",
      "description": "Invest in Africa's leading fintech platform"
    }
  ]
}
```

#### Add to Watchlist
```javascript
// POST /api/stocks/watchlist/add
const addToWatchlist = async (stockId) => {
  const response = await client.post('/api/stocks/watchlist/add', {
    stock_id: stockId
  });
  return response.data;
};

// Request body
{
  "stock_id": 1
}

// Response (200 OK)
{
  "success": true,
  "message": "Added to watchlist"
}
```

#### Get My Watchlist
```javascript
// GET /api/stocks/watchlist/me
const getWatchlist = async () => {
  const response = await client.get('/api/stocks/watchlist/me');
  return response.data.watchlist;
};

// Response (200 OK)
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

#### Remove from Watchlist
```javascript
// DELETE /api/stocks/watchlist/1
const removeFromWatchlist = async (stockId) => {
  const response = await client.delete(`/api/stocks/watchlist/${stockId}`);
  return response.data;
};

// Response (200 OK)
{
  "success": true,
  "message": "Removed from watchlist"
}
```

---

### ⚡ ORDERS

#### Place Order (Buy/Sell)
```javascript
// POST /api/orders/place
const placeOrder = async (orderData) => {
  const response = await client.post('/api/orders/place', {
    stock_id: 1,
    type: "buy", // or "sell"
    quantity: 10,
    price: 341.25,
    order_type: "market" // or "limit"
  });
  return response.data.order;
};

// Request body - BUY
{
  "stock_id": 1,
  "type": "buy",
  "quantity": 10,
  "price": 341.25,
  "order_type": "market"
}

// Request body - SELL
{
  "stock_id": 1,
  "type": "sell",
  "quantity": 5,
  "price": 350.00,
  "order_type": "market"
}

// Response (201 Created)
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

#### Get My Orders
```javascript
// GET /api/orders/my-orders?status=all&type=all&limit=50&offset=0
const getMyOrders = async (filters = {}) => {
  const response = await client.get('/api/orders/my-orders', {
    params: {
      status: filters.status || 'all', // all|pending|completed|cancelled
      type: filters.type || 'all', // all|buy|sell
      limit: filters.limit || 50,
      offset: filters.offset || 0
    }
  });
  return response.data.orders;
};

// Response (200 OK)
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

### 📊 PORTFOLIO

#### Get Full Portfolio
```javascript
// GET /api/portfolio
const getPortfolio = async () => {
  const response = await client.get('/api/portfolio');
  return response.data;
};

// Response (200 OK)
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

#### Get Portfolio Performance
```javascript
// GET /api/portfolio/summary/performance
const getPerformance = async () => {
  const response = await client.get('/api/portfolio/summary/performance');
  return response.data.performance;
};

// Response (200 OK)
{
  "success": true,
  "performance": {
    "wallet_balance": 100000.00,
    "portfolio_value": 50000.00,
    "total_assets": 150000.00,
    "total_trades": 15,
    "total_invested": 45000.00,
    "total_from_sales": 5000.00
  }
}
```

---

## ⚠️ Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical error details"
}
```

### Common Errors

#### 400 Bad Request
```javascript
// Invalid email format
{
  "success": false,
  "message": "Invalid email format",
  "error": "ValidationError"
}

// Insufficient balance
{
  "success": false,
  "message": "Insufficient balance. You have ₦50,000 available",
  "error": "InsufficientFunds"
}
```

#### 401 Unauthorized
```javascript
// Missing token
{
  "success": false,
  "message": "Access denied. No token provided.",
  "error": "NoToken"
}

// Invalid/expired token
{
  "success": false,
  "message": "Invalid or expired token. Please login again.",
  "error": "InvalidToken"
}
```

#### 404 Not Found
```javascript
{
  "success": false,
  "message": "Stock not found",
  "error": "NotFound"
}
```

#### 500 Server Error
```javascript
{
  "success": false,
  "message": "Could not fetch stocks",
  "error": "Internal Server Error"
}
```

### Error Handling Implementation

```javascript
// hooks/useApi.js
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import client from '../api/client';

export const useApi = () => {
  const { logout } = useAuth();

  const handleError = useCallback((error) => {
    if (error.response?.status === 401) {
      // Token expired - logout user
      logout();
      return { error: 'Session expired. Please login again.' };
    }

    if (error.response?.status === 400) {
      return {
        error: error.response.data.message || 'Invalid request'
      };
    }

    if (error.response?.status === 404) {
      return { error: 'Resource not found' };
    }

    if (error.response?.status === 500) {
      return { error: 'Server error. Please try again later.' };
    }

    return { error: error.message };
  }, [logout]);

  return { handleError };
};
```

---

## 💻 Code Examples

### Complete Login/Register Flow

```javascript
// AuthContext.js
import React, { createContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const register = useCallback(async (fullName, email, phone, password) => {
    setLoading(true);
    try {
      const response = await client.post('/api/auth/register', {
        full_name: fullName,
        email,
        phone,
        password
      });

      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      await AsyncStorage.setItem('auth_token', token);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await client.post('/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      await AsyncStorage.setItem('auth_token', token);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('auth_token');
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

### Trading Example

```javascript
// hooks/useTrading.js
import { useCallback, useState } from 'react';
import client from '../api/client';

export const useTrading = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const placeOrder = useCallback(async (stockId, type, quantity, price) => {
    setLoading(true);
    setError(null);

    try {
      const response = await client.post('/api/orders/place', {
        stock_id: stockId,
        type, // 'buy' or 'sell'
        quantity,
        price,
        order_type: 'market'
      });

      return response.data.order;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Order failed';
      setError(errorMsg);
      throw errorMsg;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.get('/api/portfolio');
      return response.data;
    } catch (err) {
      setError('Failed to fetch portfolio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { placeOrder, getPortfolio, loading, error };
};
```

### Using React Query for Data Fetching

```javascript
// hooks/useStocks.js
import { useQuery } from 'react-query';
import client from '../api/client';

export const useStocks = (search, sector) => {
  return useQuery(
    ['stocks', search, sector],
    async () => {
      const response = await client.get('/api/stocks', {
        params: { search, sector }
      });
      return response.data.stocks;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000 // 10 minutes
    }
  );
};

export const useStockDetails = (ticker) => {
  return useQuery(
    ['stock', ticker],
    async () => {
      const response = await client.get(`/api/stocks/${ticker}`);
      return response.data.stock;
    },
    {
      enabled: !!ticker,
      staleTime: 2 * 60 * 1000
    }
  );
};

export const useTrendingStocks = () => {
  return useQuery(
    'trending-stocks',
    async () => {
      const response = await client.get('/api/stocks/trending/list');
      return response.data.trending;
    },
    {
      staleTime: 10 * 60 * 1000
    }
  );
};
```

---

## ✨ Best Practices

### 1. Token Management

```javascript
// Secure token storage (React Native)
import * as SecureStore from 'expo-secure-store';

const saveToken = async (token) => {
  await SecureStore.setItemAsync('auth_token', token);
};

const getToken = async () => {
  return await SecureStore.getItemAsync('auth_token');
};

const clearToken = async () => {
  await SecureStore.deleteItemAsync('auth_token');
};
```

### 2. API Request Interceptors

```javascript
// Add error handling globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - refresh or logout
      // Dispatch logout action
    }
    return Promise.reject(error);
  }
);
```

### 3. Loading States

```javascript
const [isLoading, setIsLoading] = useState(false);
const [isRefreshing, setIsRefreshing] = useState(false);

// Always show loading indicator
const fetchData = async () => {
  setIsLoading(true);
  try {
    // fetch
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Error Messages for Users

```javascript
// Always show user-friendly messages
const getErrorMessage = (error) => {
  if (error.response?.status === 401) {
    return 'Your session has expired. Please login again.';
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  return 'Something went wrong. Please try again.';
};
```

### 5. Data Validation

```javascript
// Validate before sending to API
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

const validatePhoneNumber = (phone) => {
  return /^\d{10,11}$/.test(phone.replace(/\D/g, ''));
};
```

### 6. Pagination

```javascript
// Handle large lists with pagination
const [page, setPage] = useState(0);
const limit = 20;

const fetchMore = async () => {
  const newPage = page + 1;
  const response = await client.get('/api/orders/my-orders', {
    params: {
      limit,
      offset: newPage * limit
    }
  });
  
  setOrders([...orders, ...response.data.orders]);
  setPage(newPage);
};
```

### 7. Caching Strategy

```javascript
// Use React Query for automatic caching
const {
  data: stocks,
  isLoading,
  error,
  refetch
} = useQuery(
  'stocks',
  fetchStocks,
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true // Refetch when tab is focused
  }
);
```

---

## 🔗 Additional Resources

- **API Status**: Check backend health at `/` endpoint
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for all origins in development
- **Timeout**: 10 seconds per request (adjust in client config)

---

## 📞 Support

For issues or questions:
1. Check the error message returned by the API
2. Verify your token is valid
3. Check the request payload format
4. Review this documentation
5. Contact backend team if issue persists

---

**Last Updated**: April 2026
**API Version**: 1.0.0
**Status**: ✅ Production Ready
