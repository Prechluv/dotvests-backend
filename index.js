const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const stockRoutes = require('./routes/stocks');
const orderRoutes = require('./routes/orders');
const walletRoutes = require('./routes/wallet');
const portfolioRoutes = require('./routes/portfolio');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const waitlistRoutes = require('./routes/waitlist');
const contactRoutes = require('./routes/contact');

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' }
});
app.use(limiter);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/contact', contactRoutes);

app.get('/', function(req, res) {
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
      payment: '/api/payment',
      waitlist: '/api/waitlist',
      contact: '/api/contact'
    }
  });
});

app.use(function(req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', function() {
  console.log('Server running on port ' + PORT);
});
