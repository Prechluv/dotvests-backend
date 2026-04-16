# Deploy to Render.com

Step-by-step guide to deploy DotVests backend to Render.com

---

## ✅ Pre-Deployment Fixes (Already Applied)

Your package.json has been updated with:
- ✅ `"start": "node index.js"` script
- ✅ `"engines": { "node": "20.x" }` specification
- ✅ Better description and metadata

---

## 🚀 Deploy to Render (5 minutes)

### Step 1: Push Changes to GitHub

```bash
# Commit the package.json changes
git add package.json
git commit -m "fix: Add start script and Node version for Render deployment"
git push origin main  # or your branch
```

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Authorize Render to access your repositories

### Step 3: Create Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Select your **`dotvests-backend`** repository
3. Click **"Connect"**

### Step 4: Configure Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `dotvests-backend` |
| **Environment** | `Node` |
| **Region** | Choose closest to you |
| **Branch** | `main` (or your branch) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (or Paid if needed) |

### Step 5: Add Environment Variables

Click **"Advanced"** or **"Environment"** section:

Add these variables:
```
PORT=10000
JWT_SECRET=your_very_secure_secret_key_here
JWT_EXPIRES_IN=7d
SENDGRID_API_KEY=SG.your_sendgrid_key
FROM_EMAIL=noreply@dotvests.com
FRONTEND_URL=https://your-frontend-domain.com
PAYSTACK_SECRET_KEY=sk_live_your_paystack_key
PRIVATE_KEY=0xyour_private_key (optional)
PLATFORM_WALLET=0xyour_wallet_address (optional)
DTV_CONTRACT=0x... (optional)
TEL_CONTRACT=0x... (optional)
ORB_CONTRACT=0x... (optional)
CEM_CONTRACT=0x... (optional)
```

### Step 6: Deploy

Click **"Create Web Service"**

Render will:
- ✅ Build your app (`npm install`)
- ✅ Start your server (`npm start`)
- ✅ Assign a URL: `https://dotvests-backend.onrender.com`

---

## 🧪 Verify Deployment

Once deployed, test these URLs:

```bash
# 1. Test root endpoint
curl https://dotvests-backend.onrender.com/

# Expected response:
# {"success":true,"message":"DotVests API is live",...}

# 2. Test stocks endpoint
curl https://dotvests-backend.onrender.com/api/stocks

# 3. Test registration
curl -X POST https://dotvests-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","email":"test@test.com","password":"pass123"}'
```

---

## 🔗 Database on Render

**Important**: SQLite database resets on Render free tier deploys

For persistence, you have two options:

### Option A: Use PostgreSQL (Recommended)

1. In Render dashboard, create new **PostgreSQL** database
2. Get connection string
3. Update your code to use PostgreSQL instead of SQLite

### Option B: Accept SQLite reset

- SQLite data resets when service restarts
- Acceptable for development/testing
- Not suitable for production

For now, SQLite is fine for testing.

---

## 📊 Monitor Your Deployment

### View Logs
```
Dashboard → Service → Logs
```

### Check Health
```
Dashboard → Service → Health
```

### View Metrics
```
Dashboard → Service → Metrics (Paid plans)
```

---

## 🆘 Troubleshooting Build Errors

### Error: "npm install failed"
**Cause**: Missing dependencies or permission issues

**Fix**:
```bash
# Locally verify:
rm -rf node_modules
rm package-lock.json
npm install

# Push changes:
git add package-lock.json
git commit -m "Update package-lock.json"
git push origin main
```

### Error: "Start command failed"
**Cause**: `npm start` not defined

**Fix**: ✅ Already fixed in your package.json

### Error: "Cannot find module X"
**Cause**: Package not in dependencies

**Fix**:
```bash
npm install missing-package-name
git add package.json
git commit -m "Add missing dependency"
git push origin main
```

### Error: "Cannot connect to database"
**Cause**: SQLite file path issue on Render

**Fix**: Ensure `db/` directory is writable:
```javascript
// In config/db.js
const path = require('path');
const dbPath = path.join(__dirname, '../db/dotvests.db');
// Render will create this automatically
```

### Error: "Environment variables undefined"
**Cause**: Variables not set in Render dashboard

**Fix**:
1. Go to Render dashboard
2. Select your service
3. Click "Environment" tab
4. Add all missing variables
5. Click "Save"
6. Render auto-redeploys

---

## 🔄 Redeploy After Changes

After making code changes:

```bash
# Commit changes
git add .
git commit -m "your message"
git push origin main

# Render auto-redeploys on push
# Monitor at: dashboard → Service → Deployments
```

Or manually redeploy:
1. Dashboard → Service → Deployments tab
2. Click three dots on latest deployment
3. Select "Redeploy"

---

## 🛡️ Security Checklist for Production

- [ ] All secrets in environment variables (not in code)
- [ ] `NODE_ENV=production` (optional, set in Render if needed)
- [ ] HTTPS enforced (Render provides free SSL)
- [ ] CORS configured for your frontend URL
- [ ] Rate limiting enabled (already in your code)
- [ ] Error handling in place (already done)

---

## 📈 Next Steps After Deployment

1. **Update Frontend**: Change API base URL to your Render URL
   ```javascript
   // From: http://localhost:3000
   // To: https://dotvests-backend.onrender.com
   ```

2. **Test All Endpoints**: Use Postman or API testing tools

3. **Set Up Monitoring**: Add error tracking
   ```bash
   npm install --save @sentry/node
   # Configure Sentry in your code
   ```

4. **Setup Logging**: Monitor production issues
   ```javascript
   // Add logging to key endpoints
   console.log(`[${new Date().toISOString()}] Request received...`);
   ```

5. **Backup Database**: Implement regular backups if using PostgreSQL

---

## 💰 Render Pricing

| Plan | Price | Best For |
|------|-------|----------|
| **Free** | $0/month | Development, testing |
| **Starter** | $7/month | Small production apps |
| **Standard** | $25/month | Medium production |
| **Pro** | $50+/month | Large production |

For DotVests, **Free plan is fine** for MVP testing.

---

## 🎯 Common Production Issues

### Issue: Service keeps restarting
```
Cause: Crashing on startup
Fix: Check logs, fix environment variables
```

### Issue: Slow performance
```
Cause: Free tier limitations
Fix: Upgrade to Starter plan
```

### Issue: Database data lost
```
Cause: SQLite doesn't persist on Render free tier
Fix: Switch to PostgreSQL
```

### Issue: Emails not sending
```
Cause: SendGrid key issue
Fix: Verify SENDGRID_API_KEY in environment
```

---

## ✨ You're Live!

Your API is now live at: **`https://dotvests-backend.onrender.com`**

Update your docs.html base URL:
```html
<span>Base URL: https://dotvests-backend.onrender.com</span>
```

---

## 📞 Need Help?

- **Render Support**: https://render.com/docs
- **Your API Docs**: Check SETUP.md
- **Deployment Checklist**: DEPLOYMENT_CHECKLIST.md

---

**Last Updated**: April 2026
**Status**: Ready to Deploy ✅
