/**
 * GamBot - Economy Utilities & Concurrency Locker
 */

const STARTING_BALANCE = 1000;
const DAILY_REWARD = 1000;
const DAILY_COOLDOWN_HOURS = 24;

// In-memory set of active user locks to prevent race condition exploits
const activeUserLocks = new Set();

/**
 * Acquire lock for user to prevent concurrent game plays
 */
function acquireLock(userId) {
  if (activeUserLocks.has(userId)) {
    return false;
  }
  activeUserLocks.add(userId);
  return true;
}

/**
 * Release lock for user
 */
function releaseLock(userId) {
  activeUserLocks.delete(userId);
}

/**
 * Format numbers with comma separation and GC suffix
 */
function formatGC(amount) {
  const num = Math.floor(Number(amount) || 0);
  return `${num.toLocaleString('en-US')} GC`;
}

/**
 * Human readable cooldown formatter
 */
function formatTimeRemaining(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

module.exports = {
  STARTING_BALANCE,
  DAILY_REWARD,
  DAILY_COOLDOWN_HOURS,
  acquireLock,
  releaseLock,
  formatGC,
  formatTimeRemaining
};
