/**
 * GamBot - Dice Rolling Game Engine
 */

const DICE_EMOJIS = {
  1: '⚀',
  2: '⚁',
  3: '⚂',
  4: '⚃',
  5: '⚄',
  6: '⚅'
};

/**
 * Play a round of Dice guess
 * @param {number} userNumber 1-6
 * @param {number} bet Amount of GamCoins wagered
 */
function playDice(userNumber, bet) {
  const parsedNumber = parseInt(userNumber, 10);
  if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 6) {
    throw new Error('Dice number must be between 1 and 6.');
  }

  // Roll standard 6-sided die
  const rolledNumber = Math.floor(Math.random() * 6) + 1;
  const isMatch = parsedNumber === rolledNumber;

  if (isMatch) {
    // 5x total payout (original bet + 4x profit)
    const payout = bet * 5;
    const profit = bet * 4;
    return {
      result: 'win',
      userNumber: parsedNumber,
      rolledNumber,
      userEmoji: DICE_EMOJIS[parsedNumber],
      rolledEmoji: DICE_EMOJIS[rolledNumber],
      multiplier: 5,
      payout,
      profit
    };
  }

  return {
    result: 'lose',
    userNumber: parsedNumber,
    rolledNumber,
    userEmoji: DICE_EMOJIS[parsedNumber],
    rolledEmoji: DICE_EMOJIS[rolledNumber],
    multiplier: 0,
    payout: 0,
    profit: -bet
  };
}

module.exports = {
  DICE_EMOJIS,
  playDice
};
