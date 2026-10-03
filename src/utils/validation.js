/**
 * GamBot - Bet & Input Validation Utility
 */

const { formatGC } = require('./economy');

/**
 * Validates a bet input against a user's current balance
 * @param {number|string} betInput 
 * @param {number} currentBalance 
 * @returns {{ valid: boolean, error?: string, amount?: number }}
 */
function validateBet(betInput, currentBalance) {
  // If string, parse and check for strictly positive integer
  const str = String(betInput).trim();

  // Reject decimal points, exponential notations, or non-digit chars
  if (!/^\d+$/.test(str)) {
    return {
      valid: false,
      error: 'Invalid bet amount. Bets must be whole positive integers (e.g. `100`, `500`).'
    };
  }

  const amount = parseInt(str, 10);

  if (isNaN(amount) || amount <= 0) {
    return {
      valid: false,
      error: 'Bet must be at least **1 GC**.'
    };
  }

  if (amount > currentBalance) {
    return {
      valid: false,
      error: `You tried to bet **${formatGC(amount)}**, but you only have **${formatGC(currentBalance)}**.`
    };
  }

  return {
    valid: true,
    amount
  };
}

module.exports = {
  validateBet
};
