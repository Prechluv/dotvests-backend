const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

// GET MY PORTFOLIO
router.get('/', protect, (req, res) => {
  try {
    const holdings = db.prepare(`
      SELECT 
        p.*,
        s.name as stock_name,
        s.ticker,
        s.sector,
        s.price as current_price,
        s.logo,
        (p.quantity * s.price) as current_value,
        (p.quantity * p.avg_buy_price) as cost_basis,
        ((s.price - p.avg_buy_price) * p.quantity) as profit_loss,
        (((s.price - p.avg_buy_price) / p.avg_buy_price) * 100) as profit_loss_percent
      FROM portfolio p
      INNER JOIN stocks s ON p.stock_id = s.id
      WHERE p.user_id = ?
      ORDER BY current_value DESC
    `).all(req.user.id);

    const totalCurrentValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
    const totalCostBasis = holdings.reduce((sum, h) => sum + h.cost_basis, 0);
    const totalProfitLoss = totalCurrentValue - totalCostBasis;
    const totalProfitLossPercent = totalCostBasis > 0
      ? ((totalProfitLoss / totalCostBasis) * 100).toFixed(2)
      : 0;

    return res.status(200).json({
      success: true,
      summary: {
        total_current_value: totalCurrentValue,
        total_cost_basis: totalCostBasis,
        total_profit_loss: totalProfitLoss,
        total_profit_loss_percent: totalProfitLossPercent,
        number_of_holdings: holdings.length
      },
      holdings
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch portfolio',
      error: error.message
    });
  }
});

// GET SINGLE HOLDING
router.get('/:stock_id', protect, (req, res) => {
  try {
    const holding = db.prepare(`
      SELECT
        p.*,
        s.name as stock_name,
        s.ticker,
        s.sector,
        s.price as current_price,
        s.logo,
        s.description,
        (p.quantity * s.price) as current_value,
        (p.quantity * p.avg_buy_price) as cost_basis,
        ((s.price - p.avg_buy_price) * p.quantity) as profit_loss,
        (((s.price - p.avg_buy_price) / p.avg_buy_price) * 100) as profit_loss_percent
      FROM portfolio p
      INNER JOIN stocks s ON p.stock_id = s.id
      WHERE p.user_id = ? AND p.stock_id = ?
    `).get(req.user.id, req.params.stock_id);

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'You do not own this stock'
      });
    }

    return res.status(200).json({
      success: true,
      holding
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch holding',
      error: error.message
    });
  }
});

// GET PORTFOLIO PERFORMANCE SUMMARY
router.get('/summary/performance', protect, (req, res) => {
  try {
    const totalTrades = db.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ?'
    ).get(req.user.id);

    const totalBought = db.prepare(
      'SELECT SUM(total) as total FROM orders WHERE user_id = ? AND type = "buy"'
    ).get(req.user.id);

    const totalSold = db.prepare(
      'SELECT SUM(total) as total FROM orders WHERE user_id = ? AND type = "sell"'
    ).get(req.user.id);

    const wallet = db.prepare(
      'SELECT balance FROM wallets WHERE user_id = ?'
    ).get(req.user.id);

    const holdings = db.prepare(`
      SELECT SUM(p.quantity * s.price) as portfolio_value
      FROM portfolio p
      INNER JOIN stocks s ON p.stock_id = s.id
      WHERE p.user_id = ?
    `).get(req.user.id);

    return res.status(200).json({
      success: true,
      performance: {
        wallet_balance: wallet ? wallet.balance : 0,
        portfolio_value: holdings.portfolio_value || 0,
        total_assets: (wallet ? wallet.balance : 0) + (holdings.portfolio_value || 0),
        total_trades: totalTrades.count,
        total_invested: totalBought.total || 0,
        total_from_sales: totalSold.total || 0
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch performance',
      error: error.message
    });
  }
});

module.exports = router;