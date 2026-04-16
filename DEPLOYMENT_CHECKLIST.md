# Deployment Readiness Checklist

Complete guide to verify your backend will deploy successfully.

---

## ✅ Pre-Deployment Verification

### 1. Local Testing (Critical)

#### Test all endpoints are working
```bash
# Start server locally
node index.js

# In another terminal, run comprehensive tests
bash /tmp/test_api.sh
```

Check these specific endpoints:

```bash
# 1. Authentication
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","email":"test@test.com","password":"pass123"}'

# 2. User endpoints
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Stocks
curl http://localhost:3000/api/stocks

# 4. Wallet
curl http://localhost:3000/api/wallet \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Portfolio (the one we just fixed)
curl http://localhost:3000/api/portfolio/summary/performance \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Orders
curl http://localhost:3000/api/orders/my-orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# 7. Admin (needs admin token)
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: All return `"success": true`

---

### 2. Environment Configuration Check

#### Verify all required variables are set
```bash
# Check .env file exists
ls -la .env

# Verify all required variables
echo "Checking environment variables..."
grep -E "^(PORT|JWT_SECRET|JWT_EXPIRES_IN|SENDGRID_API_KEY|FROM_EMAIL|FRONTEND_URL|PAYSTACK_SECRET_KEY)" .env

# Should show all these variables
```

**Checklist**:
```
✓ PORT=3000 (or your production port)
✓ JWT_SECRET=<long_random_string>
✓ JWT_EXPIRES_IN=7d
✓ SENDGRID_API_KEY=SG.<key>
✓ FROM_EMAIL=noreply@domain.com
✓ FRONTEND_URL=http://yourfrontend.com (or https for production)
✓ PAYSTACK_SECRET_KEY=sk_test_<key> (or sk_live_ for production)
```

Optional (only if using blockchain):
```
✓ PRIVATE_KEY=0x<key>
✓ PLATFORM_WALLET=0x<address>
✓ DTV_CONTRACT=0x<address>
✓ TEL_CONTRACT=0x<address>
✓ ORB_CONTRACT=0x<address>
✓ CEM_CONTRACT=0x<address>
```

---

### 3. Code Quality Checks

#### No console errors or warnings
```bash
# Start server and check for errors
node index.js 2>&1 | head -50

# Should show:
# ✅ "DotVests database connected and tables ready"
# ✅ "Server running on port 3000"
# ❌ Should NOT show: TypeError, SyntaxError, ReferenceError, etc.
```

#### No hardcoded secrets
```bash
# Check for hardcoded credentials
grep -r "sk_test_\|sk_live_\|0x[a-f0-9]\{40\}" --include="*.js" . | grep -v node_modules | grep -v ".env"

# Should return: nothing (all secrets in .env)
```

#### Check for debugging code
```bash
# Look for console.log (should be minimal)
grep -r "console.log\|debugger" --include="*.js" routes/ | wc -l

# Should be < 10 (normal logging is ok)
```

---

### 4. Dependencies Check

#### Verify all required packages installed
```bash
# Check node_modules exists and has dependencies
ls -la node_modules | wc -l

# Should be > 100 (many sub-dependencies)

# Verify key packages
npm list express cors helmet better-sqlite3 jsonwebtoken bcryptjs ethers axios @sendgrid/mail

# Should show all packages with versions
```

#### No security vulnerabilities
```bash
# Check for known vulnerabilities
npm audit

# Ideally: "0 vulnerabilities"
# If warnings exist: npm audit fix (or accept if low risk)
```

---

### 5. Database Check

#### Database file exists and is valid
```bash
# Check SQLite database
ls -lh db/dotvests.db

# Should be > 0 bytes

# Verify tables exist
sqlite3 db/dotvests.db ".tables"

# Should show: notifications orders portfolio stocks transactions users wallets watchlists
```

#### No migration issues
```bash
# Start fresh database test
rm db/dotvests.db  # Delete old DB
node index.js      # Restart - should auto-create tables
```

---

### 6. Git & Version Control

#### Clean git status
```bash
# Check uncommitted changes
git status

# Should show: "On branch main, nothing to commit, working tree clean"
# (or "dev" branch, depending on your workflow)
```

#### .env is in .gitignore
```bash
# Verify .env is ignored
cat .gitignore | grep ".env"

# Should show: .env

# Double check it's not committed
git log --full-history -- .env | head -5

# Should be empty (no commits touching .env)
```

#### Recent commits are clean
```bash
# Check recent commit messages
git log --oneline -10

# Should show meaningful messages about fixes/features
```

---

## 🚀 Deployment Platform-Specific Checks

### For Heroku

```bash
# 1. Create Procfile (tells Heroku how to start)
echo "web: node index.js" > Procfile

# 2. Verify package.json has start script
grep '"start"' package.json
# Should show: "start": "node index.js" (or add it if missing)

# 3. Check Heroku toolbelt installed
heroku --version

# 4. Login to Heroku
heroku login

# 5. Create Heroku app
heroku create dotvests-backend  # or your app name

# 6. Set environment variables on Heroku
heroku config:set JWT_SECRET="your-secret" \
  SENDGRID_API_KEY="your-key" \
  PAYSTACK_SECRET_KEY="your-key" \
  etc...

# 7. Deploy
git push heroku main  # or your branch
```

---

### For Render.com

```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to https://render.com
# 3. Connect GitHub account
# 4. Create new Web Service
# 5. Select your repository
# 6. Configure:
#    - Runtime: Node
#    - Build Command: npm install
#    - Start Command: node index.js
# 7. Add Environment Variables in dashboard
# 8. Deploy

# Or use Render CLI:
npm install -g @render-com/cli
render login
render create-web-service --github-repo YOUR_REPO
```

---

### For AWS/DigitalOcean/VPS

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Install Node
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone https://github.com/yourusername/dotvests-backend.git
cd dotvests-backend

# 4. Install dependencies
npm install --production

# 5. Create .env file
nano .env
# Paste your production environment variables

# 6. Test startup
node index.js

# 7. Use process manager (PM2)
npm install -g pm2
pm2 start index.js --name "dotvests"
pm2 save
pm2 startup

# 8. Setup reverse proxy (nginx)
sudo nano /etc/nginx/sites-available/dotvests
# Configure to forward to port 3000
```

---

## 📋 Pre-Deployment Checklist

Print this and verify each item:

### Code & Dependencies
- [ ] All endpoints tested locally and working
- [ ] No console errors or warnings on startup
- [ ] No hardcoded secrets in code
- [ ] No `console.log` or `debugger` statements in production code
- [ ] All required npm packages installed
- [ ] No security vulnerabilities (npm audit)
- [ ] package.json has correct Node version

### Environment
- [ ] .env file created with all required variables
- [ ] .env is in .gitignore
- [ ] .env is NOT committed to git
- [ ] All secrets are strong (especially JWT_SECRET)
- [ ] Frontend URL is correct in FRONTEND_URL
- [ ] Port is available on deployment server

### Database
- [ ] SQLite database file exists (db/dotvests.db)
- [ ] Database has all required tables
- [ ] No database connection errors on startup

### Git & Version Control
- [ ] All code committed (git status clean)
- [ ] Meaningful commit messages
- [ ] Latest changes pushed to remote
- [ ] No .env in git history
- [ ] Deployment branch is up to date

### Third-Party Services
- [ ] SendGrid API key valid and funded (for emails)
- [ ] Paystack account set up with test/live keys
- [ ] All API keys have correct permissions
- [ ] Email configuration tested (password reset)
- [ ] Payment processing tested (if applicable)

### Performance & Security
- [ ] Rate limiting enabled (15 min / 100 requests)
- [ ] CORS configured correctly
- [ ] Helmet security headers enabled
- [ ] HTTPS enforced on production
- [ ] Sensitive data not logged
- [ ] Error messages don't expose internal details

### Deployment Specific
- [ ] Procfile created (if using Heroku)
- [ ] Start script in package.json verified
- [ ] Environment variables set in deployment platform
- [ ] Database migration plan (if needed)
- [ ] Rollback plan documented
- [ ] Monitoring/logging set up

---

## 🧪 Deployment Test (Dry Run)

Before actual deployment, simulate it locally:

```bash
# 1. Set production environment
export NODE_ENV=production
export PORT=8080

# 2. Install only production dependencies
npm install --production

# 3. Start server
node index.js

# 4. Run full test suite in another terminal
bash /tmp/test_api.sh

# 5. Verify all responses have "success": true
```

---

## 🚨 Common Deployment Issues

### Issue: "Cannot find module X"
```
Fix: npm install
```

### Issue: "Port already in use"
```
Fix: Change PORT in .env or kill process: lsof -i :3000 | kill -9 PID
```

### Issue: ".env variables undefined"
```
Fix: Verify .env exists in root directory
     Restart server after changing .env
```

### Issue: "Database connection error"
```
Fix: Ensure db/ directory exists: mkdir -p db
     Check file permissions: chmod 755 db/
```

### Issue: "JWT token invalid"
```
Fix: Regenerate JWT_SECRET
     Make sure same SECRET used everywhere
```

### Issue: "CORS errors"
```
Fix: Update FRONTEND_URL in .env to your production URL
     Restart server
```

---

## ✅ Post-Deployment

After deployment:

```bash
# 1. Verify server is running
curl https://your-domain.com/

# 2. Test key endpoints
curl https://your-domain.com/api/stocks
curl -X POST https://your-domain.com/api/auth/register ...

# 3. Check logs for errors
# (depends on deployment platform)

# 4. Monitor for crashes
# Set up error tracking: Sentry, LogRocket, etc.

# 5. Verify email notifications
# Test password reset email

# 6. Verify payment processing
# Test Paystack payment flow

# 7. Check database
# Verify users can register, data persists

# 8. Performance monitoring
# Set up uptime monitoring: UptimeRobot, StatusPage, etc.
```

---

## 🎯 Deployment Confidence Score

Count how many items you've completed:

**20-25**: ✅ **Ready to deploy** - You're well prepared
**15-19**: 🟡 **Almost ready** - Complete a few more checks
**10-14**: 🔴 **Not ready yet** - Do more testing locally
**<10**: 🔴 **Hold off** - More work needed

---

## 📞 Need Help?

If deployment fails:

1. Check server logs: `pm2 logs dotvests` or platform-specific logs
2. Check .env variables are set correctly
3. Verify all services (SendGrid, Paystack) are configured
4. Test endpoints: `curl https://your-domain.com/api/stocks`
5. Check git history: `git log --oneline | head -5`

---

Generated: April 2026
Version: 1.0.0
