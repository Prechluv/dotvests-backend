# .env Quick Reference Card

Copy this and fill in the blanks. Then save as `.env` in your project root.

---

## Step-by-Step Setup (10 minutes)

### 1️⃣ JWT_SECRET
```bash
# Generate this in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Then paste the output below
JWT_SECRET=<PASTE_GENERATED_VALUE>
```

### 2️⃣ SendGrid (Emails)
- Go to: https://sendgrid.com
- Sign up (free 100 emails/day)
- Settings → API Keys → Create API Key
- Copy key below

```env
SENDGRID_API_KEY=SG.<YOUR_KEY_HERE>
FROM_EMAIL=noreply@dotvests.com
```

### 3️⃣ Paystack (Payments)
- Go to: https://paystack.com
- Sign up (Nigeria/Ghana/Kenya, etc.)
- Settings → API Keys & Webhooks
- Copy Secret Key (starts with `sk_test_`)

```env
PAYSTACK_SECRET_KEY=sk_test_<YOUR_KEY_HERE>
```

### 4️⃣ Blockchain (ZetaChain)
- Install MetaMask browser extension
- Create wallet
- Switch network to "ZetaChain Athens Testnet" (in MetaMask)
- Go to: https://testnet.zeta.tools/faucet
- Enter your wallet address → Get testnet ZETA tokens
- Back in MetaMask: Account Details → Export Private Key
- Copy the address (0x...) and private key (0x...)

```env
PRIVATE_KEY=0x<YOUR_PRIVATE_KEY>
PLATFORM_WALLET=0x<YOUR_WALLET_ADDRESS>
```

### 5️⃣ Contract Addresses (If using blockchain)
If you haven't deployed contracts yet, use placeholder values or leave blank:

```env
DTV_CONTRACT=0x<CONTRACT_ADDRESS_1>
TEL_CONTRACT=0x<CONTRACT_ADDRESS_2>
ORB_CONTRACT=0x<CONTRACT_ADDRESS_3>
CEM_CONTRACT=0x<CONTRACT_ADDRESS_4>
```

### 6️⃣ Frontend & Server
```env
FRONTEND_URL=http://localhost:3000
PORT=3000
JWT_EXPIRES_IN=7d
```

---

## 📝 Complete .env File

```env
PORT=3000
JWT_SECRET=<GENERATED_VALUE>
JWT_EXPIRES_IN=7d
SENDGRID_API_KEY=SG.<YOUR_SENDGRID_KEY>
FROM_EMAIL=noreply@dotvests.com
FRONTEND_URL=http://localhost:3000
PAYSTACK_SECRET_KEY=sk_test_<YOUR_PAYSTACK_KEY>
PRIVATE_KEY=0x<YOUR_PRIVATE_KEY>
PLATFORM_WALLET=0x<YOUR_WALLET_ADDRESS>
DTV_CONTRACT=0x<DTV_ADDRESS>
TEL_CONTRACT=0x<TEL_ADDRESS>
ORB_CONTRACT=0x<ORB_ADDRESS>
CEM_CONTRACT=0x<CEM_ADDRESS>
```

---

## 🚀 After Creating .env

```bash
# 1. Install dependencies
npm install

# 2. Start server
node index.js

# 3. Test it works
# Open browser: http://localhost:3000
# Should see: "DotVests API is live"
```

---

## 🔐 Security Reminders

✅ **DO:**
- Generate strong JWT_SECRET
- Keep .env file in .gitignore (already done)
- Use test keys during development
- Use different keys for staging/production

❌ **DON'T:**
- Commit .env to git
- Share private keys
- Use same key for multiple environments
- Upload .env to public repos

---

## 📍 Where to Get Each Value

| Variable | Source | Format |
|----------|--------|--------|
| PORT | You choose | Number (3000) |
| JWT_SECRET | Generate (crypto) | Hex string |
| JWT_EXPIRES_IN | You choose | Time (7d, 24h) |
| SENDGRID_API_KEY | https://sendgrid.com | `SG.xxx` |
| FROM_EMAIL | You choose | `name@domain.com` |
| FRONTEND_URL | Your app URL | `http://localhost:3000` |
| PAYSTACK_SECRET_KEY | https://paystack.com | `sk_test_xxx` |
| PRIVATE_KEY | MetaMask wallet | `0x...` |
| PLATFORM_WALLET | MetaMask wallet | `0x...` |
| *_CONTRACT | Deploy contracts | `0x...` |

---

## ✅ Verification Checklist

After filling .env:

- [ ] JWT_SECRET is set (not empty)
- [ ] SENDGRID_API_KEY starts with `SG.`
- [ ] PAYSTACK_SECRET_KEY starts with `sk_test_` or `sk_live_`
- [ ] PRIVATE_KEY starts with `0x`
- [ ] PLATFORM_WALLET starts with `0x`
- [ ] FRONTEND_URL is correct
- [ ] .env is in root directory
- [ ] .env is in .gitignore
- [ ] Server starts: `node index.js`

---

Need help? See: **ENV_SETUP_GUIDE.md** (detailed guide with examples)
