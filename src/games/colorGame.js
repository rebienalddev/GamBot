/**
 * GamBot - Color Wheel Game Engine
 */

const WHEEL_COLORS = {
  red: { id: 'red', name: 'Red', emoji: '🔴', probability: 0.30, multiplier: 2.0 },
  blue: { id: 'blue', name: 'Blue', emoji: '🔵', probability: 0.25, multiplier: 2.5 },
  green: { id: 'green', name: 'Green', emoji: '🟢', probability: 0.20, multiplier: 3.0 },
  yellow: { id: 'yellow', name: 'Yellow', emoji: '🟡', probability: 0.15, multiplier: 4.0 },
  purple: { id: 'purple', name: 'Purple', emoji: '🟣', probability: 0.10, multiplier: 6.0 }
};

/**
 * Spin the Color Wheel
 * @param {string} userColorChoice 'red' | 'blue' | 'green' | 'yellow' | 'purple'
 * @param {number} bet Amount of GamCoins wagered
 */
function spinColorWheel(userColorChoice, bet) {
  const normalized = userColorChoice.toLowerCase();
  const userColor = WHEEL_COLORS[normalized];

  if (!userColor) {
    throw new Error('Invalid color choice. Choose red, blue, green, yellow, or purple.');
  }

  // Random spin based on probability distribution
  const rand = Math.random();
  let cumulative = 0;
  let landedColor = WHEEL_COLORS.red; // default fallback

  for (const key of Object.keys(WHEEL_COLORS)) {
    const col = WHEEL_COLORS[key];
    cumulative += col.probability;
    if (rand < cumulative) {
      landedColor = col;
      break;
    }
  }

  const isWin = userColor.id === landedColor.id;

  if (isWin) {
    const multiplier = userColor.multiplier;
    const payout = Math.floor(bet * multiplier);
    const profit = payout - bet;

    return {
      result: 'win',
      userColor,
      landedColor,
      multiplier,
      payout,
      profit
    };
  }

  return {
    result: 'lose',
    userColor,
    landedColor,
    multiplier: 0,
    payout: 0,
    profit: -bet
  };
}

module.exports = {
  WHEEL_COLORS,
  spinColorWheel
};
