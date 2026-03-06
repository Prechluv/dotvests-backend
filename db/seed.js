const db = require('../config/db');

const stocks = [
  {
    name: 'DotVest',
    ticker: 'DTV',
    sector: 'Financial Technology',
    price: 341.25,
    previous_price: 228.05,
    logo: 'dotvestlogo.jpg',
    description: 'DotVests is Africa\'s first blockchain-powered tokenized stock exchange, enabling 24/7 trading with instant settlement.'
  },
  {
    name: 'Telco',
    ticker: 'TEL',
    sector: 'Telecommunications',
    price: 1869.50,
    previous_price: 1757.30,
    logo: 'telcologo.jpg',
    description: 'Telco is a leading telecommunications company providing mobile and data services across Nigeria.'
  },
  {
    name: 'OruBank',
    ticker: 'ORB',
    sector: 'Financial Services',
    price: 315.20,
    previous_price: 304.25,
    logo: 'orubanklogo.jpg',
    description: 'OruBank is a modern digital bank providing financial services to individuals and businesses across Nigeria.'
  },
  {
    name: 'CementPro',
    ticker: 'CEM',
    sector: 'Industrial Goods',
    price: 614.28,
    previous_price: 622.96,
    logo: 'cementprologo.jpg',
    description: 'CementPro is a leading cement manufacturer and distributor operating across Nigeria and West Africa.'
  }
];

// Clear existing stocks
db.prepare('DELETE FROM stocks').run();

// Insert each stock
const insert = db.prepare(`
  INSERT INTO stocks (name, ticker, sector, price, previous_price, logo, description)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

stocks.forEach(stock => {
  insert.run(
    stock.name,
    stock.ticker,
    stock.sector,
    stock.price,
    stock.previous_price,
    stock.logo,
    stock.description
  );
  console.log(`✓ Added ${stock.name} (${stock.ticker}) — ₦${stock.price}`);
});

console.log('\n✓ All 4 stocks seeded successfully');
console.log('✓ DotVests market data is ready');