const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../db/dotvests.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Add missing columns to users table
try { db.exec(`ALTER TABLE users ADD COLUMN reset_token TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN reset_token_expiry INTEGER`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN profile_image TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN date_of_birth TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN address TEXT`); } catch(e) {}

// Add missing columns to wallets table
try { db.exec(`ALTER TABLE wallets ADD COLUMN account_number TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE wallets ADD COLUMN bank_name TEXT`); } catch(e) {}

// Add missing columns to stocks table
try { db.exec(`ALTER TABLE stocks ADD COLUMN high_52w REAL`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN low_52w REAL`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN market_cap TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN industry TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN pe_ratio REAL`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN eps REAL`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN dividend_yield REAL`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN volume TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN average_volume TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN beta REAL`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN shares_outstanding INTEGER`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN exchange TEXT DEFAULT 'NGX'`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN risk_level TEXT DEFAULT 'medium'`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN min_investment REAL DEFAULT 50000`); } catch(e) {}
try { db.exec(`ALTER TABLE stocks ADD COLUMN expected_apy REAL`); } catch(e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    source TEXT DEFAULT 'unknown'
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    pin TEXT,
    bvn TEXT,
    nin TEXT,
    kyc_status TEXT DEFAULT 'unverified',
    account_status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    balance REAL DEFAULT 0.00,
    currency TEXT DEFAULT 'NGN',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    reference TEXT UNIQUE,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ticker TEXT UNIQUE NOT NULL,
    sector TEXT,
    price REAL NOT NULL,
    previous_price REAL,
    logo TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS watchlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    order_type TEXT DEFAULT 'market',
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    avg_buy_price REAL NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

console.log('DotVests database connected and tables ready');

module.exports = db;