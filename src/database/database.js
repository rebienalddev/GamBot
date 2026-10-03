/**
 * GamBot - SQLite Database Manager
 * Handles persistent user balances, statistics, transactions, and cooldowns.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'gambot.db');
const db = new sqlite3.Database(DB_PATH);

// Helper to run query with Promise
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

// Helper to get single row
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Helper to get all rows
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Initialize tables
async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      userId TEXT PRIMARY KEY,
      balance INTEGER DEFAULT 1000,
      gamesPlayed INTEGER DEFAULT 0,
      gamesWon INTEGER DEFAULT 0,
      gamesLost INTEGER DEFAULT 0,
      totalWagered INTEGER DEFAULT 0,
      totalWon INTEGER DEFAULT 0,
      totalLost INTEGER DEFAULT 0,
      biggestWin INTEGER DEFAULT 0,
      biggestBet INTEGER DEFAULT 0,
      lastDaily INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance DESC)`);
}

// Get or create user with starting 1,000 GamCoins
async function getUser(userId) {
  let user = await get('SELECT * FROM users WHERE userId = ?', [userId]);
  if (!user) {
    await run(
      `INSERT OR IGNORE INTO users (userId, balance) VALUES (?, 1000)`,
      [userId]
    );
    user = await get('SELECT * FROM users WHERE userId = ?', [userId]);
  }
  return user;
}

// Atomic balance deduction/addition
async function updateBalance(userId, delta) {
  await run(
    `UPDATE users 
     SET balance = balance + ?, updatedAt = CURRENT_TIMESTAMP 
     WHERE userId = ?`,
    [delta, userId]
  );
  return getUser(userId);
}

// Atomic transfer between two users
async function transferCoins(senderId, recipientId, amount) {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        db.run('BEGIN TRANSACTION');

        const sender = await get('SELECT balance FROM users WHERE userId = ?', [senderId]);
        if (!sender || sender.balance < amount) {
          db.run('ROLLBACK');
          return resolve({ success: false, reason: 'insufficient_funds' });
        }

        // Deduct from sender
        db.run('UPDATE users SET balance = balance - ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?', [amount, senderId]);

        // Ensure recipient exists
        db.run('INSERT OR IGNORE INTO users (userId, balance) VALUES (?, 1000)', [recipientId]);

        // Add to recipient
        db.run('UPDATE users SET balance = balance + ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?', [amount, recipientId]);

        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          resolve({ success: true });
        });
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
}

// Atomic game result recorder
async function recordGameResult(userId, { bet, won, payout, profit, isDraw }) {
  const user = await getUser(userId);
  const newBalance = user.balance + profit; // profit can be positive, negative, or 0 (draw)
  const gamesPlayed = user.gamesPlayed + 1;
  const gamesWon = won ? user.gamesWon + 1 : user.gamesWon;
  const gamesLost = (!won && !isDraw) ? user.gamesLost + 1 : user.gamesLost;
  const totalWagered = user.totalWagered + bet;
  const totalWon = won ? user.totalWon + profit : user.totalWon;
  const totalLost = (!won && !isDraw) ? user.totalLost + bet : user.totalLost;
  const biggestWin = profit > user.biggestWin ? profit : user.biggestWin;
  const biggestBet = bet > user.biggestBet ? bet : user.biggestBet;

  await run(
    `UPDATE users 
     SET balance = ?,
         gamesPlayed = ?,
         gamesWon = ?,
         gamesLost = ?,
         totalWagered = ?,
         totalWon = ?,
         totalLost = ?,
         biggestWin = ?,
         biggestBet = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE userId = ?`,
    [
      newBalance,
      gamesPlayed,
      gamesWon,
      gamesLost,
      totalWagered,
      totalWon,
      totalLost,
      biggestWin,
      biggestBet,
      userId
    ]
  );

  return getUser(userId);
}

// Claim daily reward with 24h cooldown
async function claimDaily(userId, rewardAmount = 1000) {
  const user = await getUser(userId);
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;
  const timePassed = now - (user.lastDaily || 0);

  if (timePassed < cooldown) {
    const remaining = cooldown - timePassed;
    return {
      claimed: false,
      remainingMs: remaining,
      nextDailyTimestamp: Math.floor((user.lastDaily + cooldown) / 1000)
    };
  }

  await run(
    `UPDATE users 
     SET balance = balance + ?, 
         lastDaily = ?, 
         updatedAt = CURRENT_TIMESTAMP 
     WHERE userId = ?`,
    [rewardAmount, now, userId]
  );

  const updatedUser = await getUser(userId);
  return {
    claimed: true,
    reward: rewardAmount,
    newBalance: updatedUser.balance
  };
}

// Get top users by balance
async function getLeaderboard(limit = 10) {
  return all(
    `SELECT userId, balance, gamesPlayed, gamesWon, biggestWin 
     FROM users 
     ORDER BY balance DESC 
     LIMIT ?`,
    [limit]
  );
}

module.exports = {
  db,
  initDb,
  getUser,
  updateBalance,
  transferCoins,
  recordGameResult,
  claimDaily,
  getLeaderboard
};
