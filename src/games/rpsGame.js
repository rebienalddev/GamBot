/**
 * GamBot - Rock Paper Scissors Engine
 */

const MOVES = {
  rock: { label: 'Rock', emoji: '🪨', beats: 'scissors' },
  paper: { label: 'Paper', emoji: '📄', beats: 'rock' },
  scissors: { label: 'Scissors', emoji: '✂️', beats: 'paper' }
};

/**
 * Play a round of Rock Paper Scissors
 * @param {string} userMove 'rock' | 'paper' | 'scissors'
 * @param {number} bet Amount of GamCoins wagered
 */
function playRps(userMove, bet) {
  const moveKeys = Object.keys(MOVES);
  const normalizedUser = userMove.toLowerCase();

  if (!MOVES[normalizedUser]) {
    throw new Error('Invalid RPS move choice');
  }

  // Random bot move
  const botMoveKey = moveKeys[Math.floor(Math.random() * moveKeys.length)];
  const userChoice = MOVES[normalizedUser];
  const botChoice = MOVES[botMoveKey];

  if (normalizedUser === botMoveKey) {
    // Draw: refund original bet
    return {
      result: 'draw',
      userChoice,
      botChoice,
      multiplier: 1,
      payout: bet,
      profit: 0
    };
  }

  if (userChoice.beats === botMoveKey) {
    // User wins: return 2x bet (bet + profit)
    return {
      result: 'win',
      userChoice,
      botChoice,
      multiplier: 2,
      payout: bet * 2,
      profit: bet
    };
  }

  // User loses: lose bet
  return {
    result: 'lose',
    userChoice,
    botChoice,
    multiplier: 0,
    payout: 0,
    profit: -bet
  };
}

module.exports = {
  MOVES,
  playRps
};
