```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const stockRoutes = require('./routes/stocks');
const orderRoutes = require('./routes/orders');
const walletRoutes = require('./routes/wallet');
const portfolioRoutes = require('./routes/portfolio');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

const app = express();

// Security
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.'
  }
});
app.use(limiter);

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DotVests API is live',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      stocks: '/api/stocks',
      orders: '/api/orders',
      wallet: '/api/wallet',
      portfolio: '/api/portfolio',
      admin: '/api/admin',
      payment: '/api/payment'
    }
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => 
console.log('DotVests backend running on port ' + PORT);
console.log(`Environment: ${process.env.NODE_ENV}`);
});
```