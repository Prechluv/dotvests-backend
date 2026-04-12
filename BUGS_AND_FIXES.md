# DotVests Backend - Bugs & Issues

## Identified Issues

### 🔴 CRITICAL ISSUES

#### 1. **Missing Input Validation in Profile Update** [user.js:37-58]
- **Issue**: `/user/profile` (PATCH) doesn't validate `full_name` and `phone` before updating
- **Risk**: Can update with NULL/empty values, corrupting database
- **Fix**: Add validation to reject empty/null values

#### 2. **Route Ordering Conflict in Stocks** [stocks.js:58-146]
- **Issue**: Routes `/watchlist/add` and `/watchlist/me` ordering causes routing issues
- **Current order**: POST add (58) → GET me (103) → DELETE :stock_id (128)
- **Problem**: GET `/watchlist/me` might match DELETE pattern
- **Fix**: Reorder so specific routes (GET /watchlist/me) come before generic patterns (DELETE /watchlist/:stock_id)

#### 3. **Inconsistent Number-to-String Concatenation** [payment.js:113]
- **Issue**: `amountInNaira + ' has been added to your DotVests wallet'`
- **Problem**: Direct concatenation of number without `.toLocaleString()`
- **Current**: "100 has been added..." (inconsistent formatting)
- **Fix**: Use `.toLocaleString()` or template literal

#### 4. **Blockchain Operations Don't Block on Failure** [orders.js:86-93, 142-149]
- **Issue**: Mint/burn transactions are logged but don't prevent order completion
- **Risk**: Order recorded even if blockchain transaction fails
- **Impact**: Discrepancy between wallet state and blockchain state
- **Current behavior**: 
  ```javascript
  blockchainTx = await mintTokens(...);
  if (blockchainTx.success) { console.log(...) } 
  else { console.error(...) }  // Fails silently
  ```
- **Fix**: Should determine if blockchain failure should rollback order or just log warning

#### 5. **Null Reference in Payment Webhook** [payment.js:150-171]
- **Issue**: Webhook processes charge.success but doesn't validate user exists
- **Risk**: If user_id is invalid, wallet update fails silently
- **Current**: No error handling if wallet lookup fails
- **Fix**: Add validation and proper error handling

### 🟠 HIGH PRIORITY ISSUES

#### 6. **No Input Type Validation**
- **Issue**: Endpoints accept any type for numeric fields (quantity, price, amount)
- **Missing validations**:
  - quantity, price, amount must be positive numbers
  - stock_id must be valid integer
  - Dates should be validated
- **Affected endpoints**:
  - `POST /orders/place` - quantity, price must be > 0
  - `POST /wallet/deposit` - amount must be > 0
  - `POST /wallet/withdraw` - amount must be > 0

#### 7. **Insufficient Permission Checks**
- **Issue**: `/admin/kyc/approve` and `/admin/kyc/reject` don't verify the user being modified exists
- **Risk**: Can approve/reject non-existent users without error
- **Fix**: Add `if (!user)` check before updating

#### 8. **Transaction Reference Can Exceed UNIQUE Constraint**
- **Issue**: Reference format: `'BUY-' + Date.now() + '-' + req.user.id`
- **Risk**: If multiple requests come at exact same millisecond, reference could collide
- **Fix**: Add UUID or random component to ensure uniqueness

#### 9. **No Validation for Stock Ticker Uniqueness in Admin**
- **Issue**: `POST /stocks/admin/add` checks for existing ticker but doesn't enforce it in schema
- **Risk**: Race condition if two admins add same ticker simultaneously
- **Fix**: Ensure database constraint or use transactions

#### 10. **Decimal Precision Issues in Calculations** [portfolio.js, orders.js]
- **Issue**: Floating-point arithmetic for profit/loss calculations
- **Example**: `(s.price - p.avg_buy_price) * p.quantity` can have precision errors
- **Risk**: Rounding errors accumulate with many transactions
- **Fix**: Use fixed decimal arithmetic or round consistently

### 🟡 MEDIUM PRIORITY ISSUES

#### 11. **No Transaction Atomicity**
- **Issue**: Buy orders involve multiple DB operations (wallet update, transaction insert, portfolio update)
- **Risk**: If operation 2 fails, operation 1 is committed (inconsistent state)
- **Current**: No database transactions used
- **Fix**: Use `db.transaction()` or equivalent

#### 12. **Rate Limit is Global, Not Per-User**
- **Issue**: Rate limiter uses IP address, not user ID
- **Risk**: Users behind same NAT/proxy share rate limit quota
- **Current**: `validate: { xForwardedForHeader: false }`
- **Fix**: Consider rate limiting by user_id after authentication

#### 13. **Email Configuration Validation Missing**
- **Issue**: `forgot-password` and `reset-password` endpoints don't validate SENDGRID_API_KEY is set
- **Risk**: Silent failures in production
- **Fix**: Add configuration validation or error handling

#### 14. **Password Reset Token Not Hashed**
- **Issue**: Reset token stored in plaintext in database
- **Risk**: If DB is compromised, attacker can reset any password
- **Fix**: Hash reset tokens like passwords

#### 15. **JWT_EXPIRES_IN Could Be Too Long**
- **Issue**: Default JWT expiration not validated
- **Current**: Uses `process.env.JWT_EXPIRES_IN` (not set defaults to undefined)
- **Risk**: Expired tokens might not work properly if env var not set
- **Fix**: Set default value: `process.env.JWT_EXPIRES_IN || '7d'`

### 🔵 LOW PRIORITY ISSUES

#### 16. **No Pagination in List Endpoints**
- **Issue**: `/admin/users`, `/admin/stats`, `user/notifications` return all records
- **Risk**: Slow responses with large datasets
- **Endpoints**: Should add `limit` and `offset` query parameters

#### 17. **No Soft Deletes**
- **Issue**: User deletion would break referential integrity
- **Risk**: Can't safely delete users with history
- **Note**: Not currently an issue as delete not implemented, but should be considered

#### 18. **Timezone Handling in Timestamps**
- **Issue**: Uses `CURRENT_TIMESTAMP` (UTC in SQLite) but might need user timezone
- **Risk**: Confusing timestamps for users
- **Fix**: Consider storing timezone or converting on response

#### 19. **Missing Logging**
- **Issue**: No request logging or audit trail
- **Risk**: Hard to debug issues, no security audit trail
- **Fix**: Add logging middleware (morgan, pino, winston)

#### 20. **Environment Variable Documentation**
- **Issue**: Required env vars not documented in code
- **Fix**: Add validation and clear error messages if required vars missing

---

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| Critical | 5 | **Fix immediately** |
| High | 5 | **Fix before production** |
| Medium | 5 | **Fix soon** |
| Low | 5 | **Nice to have** |

---

## Fixes Applied (See next section)

