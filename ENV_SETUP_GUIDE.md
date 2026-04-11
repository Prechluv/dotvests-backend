# Environment Variables Setup Guide

Complete guide on how to obtain and configure each environment variable.

---

## 🔴 CRITICAL VARIABLES (Required for any environment)

### 1. PORT
```env
PORT=3000
```
**What it is**: The port your server runs on
**How to set**: Use any port 1000-65535 (3000 is standard for development)
**For local dev**: `3000` is fine
**For production**: Use `8080` or `443` if running behind a load balancer

---

### 2. JWT_SECRET
```env
JWT_SECRET=your_very_secure_random_jwt_secret_key_here
```
**What it is**: Secret key to sign JWT tokens for authentication
**How to generate**: 
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: Online (NOT for production)
# Use: https://generate-random.org/ (copy 32 random bytes in hex)
```
**Example**:
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```
**⚠️ IMPORTANT**: 
- Generate a NEW unique secret for each environment
- Never commit to git - always use .env file
- Longer = more secure (use at least 32 characters)

---

### 3. JWT_EXPIRES_IN
```env
JWT_EXPIRES_IN=7d
```
**What it is**: How long JWT tokens remain valid
**Options**:
- `7d` = 7 days (good for mobile apps)
- `24h` = 24 hours (good for web)
- `30d` = 30 days (longer expiry)
- `12h` = 12 hours (strict security)

**Recommendation**: 
- Development: `7d`
- Production: `24h` or `12h`

---

## 🟠 EMAIL CONFIGURATION (Required for password reset & notifications)

### 4. SENDGRID_API_KEY
```env
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
```

**How to get it**:
1. Go to [SendGrid](https://sendgrid.com)
2. Sign up for free account (free tier: 100 emails/day)
3. Go to **Settings** → **API Keys**
4. Click **Create API Key**
5. Name it (e.g., "DotVests Backend")
6. Select **Full Access** or **Mail Send** permission
7. Copy the key and paste in .env

**Example**:
```env
SENDGRID_API_KEY=SG.1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

**Test it works**:
```bash
# The forgot-password endpoint will test this
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

---

### 5. FROM_EMAIL
```env
FROM_EMAIL=noreply@dotvests.com
```

**What it is**: Email address that appears as the "From" in sent emails

**Options**:
1. **Use default SendGrid sender**: `noreply@dotvests.com`
2. **Use verified domain**:
   - Go to SendGrid → Settings → Sender Authentication
   - Verify your domain (add DNS records)
   - Then use: `noreply@yourdomain.com`

**Development**: `noreply@dotvests.com` is fine
**Production**: Should be your actual company domain

---

### 6. FRONTEND_URL
```env
FRONTEND_URL=http://localhost:3000
```

**What it is**: URL where your frontend/mobile app is hosted (used in email links)

**Examples**:
```env
# Development
FRONTEND_URL=http://localhost:3000

# Production
FRONTEND_URL=https://dotvests.com

# Staging
FRONTEND_URL=https://staging.dotvests.com
```

**Used for**: Password reset links in emails
```
Example email link: https://dotvests.com/reset-password?token=abc123
```

---

## 🟠 PAYMENT GATEWAY (Required for Paystack payments)

### 7. PAYSTACK_SECRET_KEY
```env
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
```

**How to get it**:
1. Go to [Paystack](https://paystack.com)
2. Create account (available for Nigeria, Ghana, Kenya, etc.)
3. Go to **Settings** → **API Keys & Webhooks**
4. Copy **Secret Key** (starts with `sk_test_` or `sk_live_`)
5. Paste in .env

**Keys**:
- `sk_test_xxx` = Test/sandbox key (for development)
- `sk_live_xxx` = Live key (for production - handle with care!)

**Example**:
```env
PAYSTACK_SECRET_KEY=sk_test_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

**Test it works**:
```bash
# Try initializing a payment
curl -X POST http://localhost:3000/api/payment/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount":100}'
```

---

## 🟠 BLOCKCHAIN (ZetaChain Integration)

### 8. PRIVATE_KEY
```env
PRIVATE_KEY=0x_your_wallet_private_key_here
```

**What it is**: Your ZetaChain wallet's private key (signs blockchain transactions)

**How to get it**:
1. Create wallet on ZetaChain:
   - Use [MetaMask](https://metamask.io) and switch to ZetaChain Athens Testnet
   - Or use [ethers.js Wallet](https://docs.ethers.org/v6/getting-started/)
2. Get testnet ZETA tokens:
   - Go to [ZetaChain Testnet Faucet](https://testnet.zeta.tools/faucet)
   - Enter your wallet address
   - Claim test tokens (free)
3. Export private key from MetaMask:
   - MetaMask → Settings → Security & Privacy → Reveal Secret Recovery Phrase
   - Or: Settings → Account Details → Export Private Key

**Example**:
```env
PRIVATE_KEY=0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p1a2b3c4d5e6f7g8h9i0j1k2l3m4n
```

**⚠️ SECURITY WARNING**:
- **NEVER** commit private key to git
- **NEVER** share with anyone
- Use a separate wallet for development/production
- Consider using AWS Secrets Manager or similar for production

---

### 9. PLATFORM_WALLET
```env
PLATFORM_WALLET=0x_platform_wallet_address_here
```

**What it is**: Wallet address where minted tokens are sent

**How to get it**:
1. Get your wallet address from MetaMask (or ethers.js)
2. Should start with `0x` followed by 40 hex characters

**Example**:
```env
PLATFORM_WALLET=0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p1a2b3c4d
```

**Note**: Can be the same as the wallet that owns the private key, or a different address

---

### 10-13. CONTRACT ADDRESSES (DTV, TEL, ORB, CEM)
```env
DTV_CONTRACT=0x_dtv_token_contract_address
TEL_CONTRACT=0x_tel_token_contract_address
ORB_CONTRACT=0x_orb_token_contract_address
CEM_CONTRACT=0x_cem_token_contract_address
```

**What they are**: Smart contract addresses for each stock token on ZetaChain

**How to get them**:
1. Deploy your token contracts on ZetaChain Athens Testnet
2. Or use existing deployed contracts
3. Copy the contract addresses (start with `0x`)

**Example**:
```env
DTV_CONTRACT=0xaabbccddeeff00112233445566778899aabbccdd
TEL_CONTRACT=0x1122334455667788990011223344556677889900
ORB_CONTRACT=0xaabbccddee00112233445566778899aabbccdd11
CEM_CONTRACT=0x1122334455667788990011223344556677889911
```

**How to deploy contracts**:
- Use [Hardhat](https://hardhat.org/) or [Truffle](https://trufflesuite.com/)
- Or use OpenZeppelin's token standard
- Deploy to ZetaChain Athens Testnet

---

## 🟢 OPTIONAL / DEVELOPMENT ONLY

### Database Configuration
Currently using SQLite (auto-created). No configuration needed.

If you want to use PostgreSQL or MySQL later:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=dotvests
```

---

## 📋 Complete .env Template

```env
# ===============================
# Server Configuration
# ===============================
PORT=3000

# ===============================
# JWT Authentication
# ===============================
JWT_SECRET=your_very_secure_random_jwt_secret_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# ===============================
# Email (SendGrid)
# ===============================
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=noreply@dotvests.com
FRONTEND_URL=http://localhost:3000

# ===============================
# Payment Gateway (Paystack)
# ===============================
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here

# ===============================
# Blockchain (ZetaChain Athens Testnet)
# ===============================
PRIVATE_KEY=0xyour_wallet_private_key_here
PLATFORM_WALLET=0xyour_platform_wallet_address_here
DTV_CONTRACT=0xdtv_token_contract_address_here
TEL_CONTRACT=0xtel_token_contract_address_here
ORB_CONTRACT=0xorb_token_contract_address_here
CEM_CONTRACT=0xcem_token_contract_address_here
```

---

## ⚡ Quick Setup (5 minutes)

### For Local Development:
```bash
# 1. Create .env
cp .env.example .env

# 2. Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output and paste into JWT_SECRET

# 3. Get SendGrid key
# Go to https://sendgrid.com → Free account → API Keys

# 4. Get Paystack key
# Go to https://paystack.com → Test key

# 5. Get blockchain setup
# Use MetaMask for wallet address & private key
# Get testnet tokens from faucet

# 6. Update .env with all values

# 7. Run
npm install
node index.js
```

---

## 🧪 Verify Setup

Run these commands to verify everything is configured:

```bash
# Check JWT works (register user)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@test.com",
    "password": "password123"
  }'

# Check Paystack (should not error about API key)
curl -X POST http://localhost:3000/api/payment/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_FROM_ABOVE" \
  -d '{"amount": 100}'

# Check database works
curl http://localhost:3000/api/stocks
```

---

## 🚨 Common Issues

### ❌ "JWT_SECRET is undefined"
**Fix**: Add `JWT_SECRET` to .env file

### ❌ "Cannot send email" (SendGrid error)
**Fix**: Verify `SENDGRID_API_KEY` is correct (starts with `SG.`)

### ❌ "Paystack initialization failed"
**Fix**: Check `PAYSTACK_SECRET_KEY` starts with `sk_test_` or `sk_live_`

### ❌ "Contract not found" (blockchain error)
**Fix**: Verify contract addresses are deployed and exist on ZetaChain

### ❌ ".env file not being read"
**Fix**: 
```bash
# Restart server after changing .env
npm install dotenv  # If not installed
node index.js
```

---

## 📊 Environment-Specific Values

### Development (.env)
```env
PORT=3000
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
PAYSTACK_SECRET_KEY=sk_test_...  # Test key
PRIVATE_KEY=0x...  # Test wallet
```

### Staging (.env.staging)
```env
PORT=8080
JWT_EXPIRES_IN=12h
FRONTEND_URL=https://staging.dotvests.com
PAYSTACK_SECRET_KEY=sk_live_...  # Real key (test data)
PRIVATE_KEY=0x...  # Staging wallet
```

### Production (.env.production)
```env
PORT=8080
JWT_EXPIRES_IN=12h
FRONTEND_URL=https://dotvests.com
PAYSTACK_SECRET_KEY=sk_live_...  # Real key
PRIVATE_KEY=0x...  # Production wallet (secure!)
```

---

## ✅ Checklist

- [ ] JWT_SECRET generated and set
- [ ] SendGrid account created and API key obtained
- [ ] FROM_EMAIL configured
- [ ] FRONTEND_URL set correctly
- [ ] Paystack account created and test key obtained
- [ ] Wallet created on ZetaChain
- [ ] Test tokens claimed from faucet
- [ ] Private key added to .env
- [ ] Contract addresses added (if using blockchain)
- [ ] .env file added to .gitignore
- [ ] Server starts without errors: `node index.js`

---

Generated: April 2026
