# Paystack Mobile Frontend Integration Guide

## Overview

This guide covers implementing Paystack payments in your React Native mobile app. Users will be able to fund their wallet directly from the app.

---

## What You Need from Backend

The backend provides these endpoints for your mobile app to use:

### 1. Initialize Payment
**Endpoint:** `POST /api/payment/initialize`

**What you send:**
```json
{
  "amount": 50000
}
```

**What you get back:**
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

### 2. Verify Payment
**Endpoint:** `GET /api/payment/verify/:reference`

**What you do:** After payment is complete, call this to confirm and credit the wallet

**What you get back:**
```json
{
  "success": true,
  "message": "₦50,000.00 deposited successfully",
  "new_balance": 125000.50
}
```

### 3. Get Banks List
**Endpoint:** `GET /api/payment/banks`

**What you get back:** List of all Nigerian banks (useful for profile/KYC setup)

```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "044", "name": "Access Bank" },
    { "id": 2, "code": "050", "name": "Eco Bank" }
  ],
  "count": 35
}
```

---

## Mobile Payment Flow

```
User taps "Fund Wallet"
    ↓
App opens amount input screen
    ↓
User enters amount & taps "Pay"
    ↓
App calls POST /api/payment/initialize
    ↓
App opens Paystack payment modal/webview with authorization_url
    ↓
User enters bank details
    ↓
User completes 3D Secure (OTP)
    ↓
Payment succeeds
    ↓
App calls GET /api/payment/verify/{reference}
    ↓
Wallet balance updated on frontend
    ↓
Show success screen
```

---

## Implementation: React Native with Webview

### 1. Install Dependencies

```bash
npm install react-native-webview axios
# or
yarn add react-native-webview axios
```

### 2. Create Deposit Component

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';

const API_BASE_URL = 'https://dotvests.com/api';

function DepositScreen({ token, onDepositSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [reference, setReference] = useState(null);

  const handleInitializePayment = async () => {
    if (!amount || parseFloat(amount) < 100) {
      Alert.alert('Error', 'Minimum deposit is ₦100');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment/initialize`,
        { amount: parseFloat(amount) },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setPaymentUrl(response.data.data.authorization_url);
        setReference(response.data.data.reference);
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize payment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = async () => {
    if (!reference) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payment/verify/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Alert.alert('Success', `Wallet funded with ₦${amount}`);
        setAmount('');
        setPaymentUrl(null);
        setReference(null);
        onDepositSuccess(response.data.new_balance);
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify payment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Show payment webview
  if (paymentUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Complete Payment</Text>
        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={(navState) => {
            // Check if we're back on the success page
            if (navState.url.includes('success') || navState.url.includes('dotvests.com')) {
              handlePaymentComplete();
            }
          }}
          style={styles.webview}
        />
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setPaymentUrl(null);
            setReference(null);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show amount input
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fund Your Wallet</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Amount (NGN)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          editable={!loading}
        />

        <Text style={styles.hint}>Minimum: ₦100</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleInitializePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Proceed to Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  form: {
    marginTop: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  webview: {
    flex: 1,
    marginTop: 20
  },
  cancelButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600'
  }
});

export default DepositScreen;
```

---

## Alternative: Using Paystack SDK

If you prefer using the official Paystack React Native library:

### 1. Install Paystack SDK

```bash
npm install react-native-paystack-webview
```

### 2. Simple Implementation

```javascript
import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import PaystackWebView from 'react-native-paystack-webview';
import axios from 'axios';

const API_BASE_URL = 'https://dotvests.com/api';

function DepositWithSDK({ token, userEmail, amount, onSuccess }) {
  const paystackWebViewRef = useRef();

  const handleInitializePayment = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payment/initialize`,
        { amount },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        paystackWebViewRef.current?.startTransaction();
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <PaystackWebView
        ref={paystackWebViewRef}
        amount={amount * 100} // in kobo
        email={userEmail}
        publicKey={process.env.PAYSTACK_PUBLIC_KEY}
        onCancel={() => console.log('Payment cancelled')}
        onSuccess={(res) => {
          // Verify payment with backend
          axios.get(
            `${API_BASE_URL}/payment/verify/${res.data.reference}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          ).then(response => {
            if (response.data.success) {
              onSuccess(response.data.new_balance);
            }
          });
        }}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleInitializePayment}
      >
        <Text style={styles.buttonText}>Pay ₦{amount}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default DepositWithSDK;
```

---

## Key Points for Mobile

### 1. **Store the User Token**
After login, store the JWT token in secure storage:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// After successful login
await AsyncStorage.setItem('userToken', loginResponse.data.token);

// Before API call
const token = await AsyncStorage.getItem('userToken');
```

### 2. **Handle Network Errors**
Always wrap API calls in try-catch:

```javascript
try {
  const response = await axios.post(url, data, { headers });
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired, redirect to login
  } else if (!error.response) {
    Alert.alert('Error', 'Network connection failed');
  }
}
```

### 3. **Show Loading States**
Disable buttons and show spinners during API calls

### 4. **Verify Payment Manually**
After Paystack redirects back, call the verify endpoint:

```javascript
// Extract reference from redirect URL
const urlParams = new URLSearchParams(window.location.search);
const reference = urlParams.get('reference');

// Verify on backend
axios.get(`/api/payment/verify/${reference}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 5. **Update Wallet Balance**
After successful verification, update the local wallet balance in your app state/context

---

## Testing Mobile Payments

### 1. Use Test Paystack Keys During Development
```env
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx  # Test public key
PAYSTACK_SECRET_KEY=sk_test_xxxxx  # Test secret key
```

### 2. Test Card Numbers
```
4084084084084081  (Visa) - any future expiry, any CVC
5399819860000015  (Mastercard) - any future expiry, any CVC
```

### 3. Test Flow
1. Run your app with test keys
2. Tap "Fund Wallet"
3. Enter test amount
4. Use test card number
5. Complete OTP verification
6. Verify wallet is credited

---

## Common Issues & Solutions

### Issue: "Network Error" when calling API

**Cause:** HTTPS certificate or CORS issue

**Solution:**
```javascript
// Add timeout
const response = await axios.post(url, data, {
  timeout: 10000,
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Issue: WebView doesn't close after payment

**Cause:** Navigation detection not working

**Solution:** Manually close after 2-3 seconds if payment succeeds:
```javascript
setTimeout(() => {
  handlePaymentComplete();
}, 2000);
```

### Issue: "Invalid public key" error

**Cause:** Wrong Paystack public key or using secret key as public key

**Solution:** Double-check you're using the **public key** (starts with `pk_`), not the secret key

### Issue: Payment verification returns "Transaction already processed"

**Cause:** Calling verify endpoint multiple times

**Solution:** Only call verify once when payment completes

---

## Summary

Your mobile app needs:

✅ User authentication token (from login)  
✅ Network library (axios or fetch)  
✅ WebView component (for Paystack checkout)  
✅ Secure storage (for token)  
✅ Error handling  
✅ Loading states  

The backend provides:
- `POST /api/payment/initialize` — Get payment URL
- `GET /api/payment/verify/:reference` — Confirm payment  
- `GET /api/payment/banks` — Bank list (for other features)

That's it! Your mobile app is ready to accept payments.
