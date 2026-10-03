/**
 * GamBot - Slots Game Engine
 */

const SYMBOLS = [
  { id: 'seven', emoji: '7️⃣', weight: 2, tripleMultiplier: 10 },
  { id: 'diamond', emoji: '💎', weight: 3, tripleMultiplier: 8 },
  { id: 'star', emoji: '⭐', weight: 4, tripleMultiplier: 6 },
  { id: 'cherry', emoji: '🍒', weight: 6, tripleMultiplier: 5 },
  { id: 'lemon', emoji: '🍋', weight: 7, tripleMultiplier: 4 },
  { id: 'orange', emoji: '🍊', weight: 8, tripleMultiplier: 3 },
  { id: 'watermelon', emoji: '🍉', weight: 9, tripleMultiplier: 3 }
];

const TWO_MATCH_MULTIPLIER = 1.5;

// Build cumulative weight pool for fast O(1) random draws
const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);

function getRandomSymbol() {
  let rand = Math.random() * TOTAL_WEIGHT;
  for (const sym of SYMBOLS) {
    if (rand < sym.weight) return sym;
    rand -= sym.weight;
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

/**
 * Spin the 3 reels of the slot machine
 * @param {number} bet Amount of GamCoins wagered
 */
function spinSlots(bet) {
  const reel1 = getRandomSymbol();
  const reel2 = getRandomSymbol();
  const reel3 = getRandomSymbol();

  const reels = [reel1, reel2, reel3];
  const emojis = reels.map(r => r.emoji);

  // Check for Triple Match
  if (reel1.id === reel2.id && reel2.id === reel3.id) {
    const multiplier = reel1.tripleMultiplier;
    const payout = Math.floor(bet * multiplier);
    const profit = payout - bet;

    return {
      result: 'jackpot',
      reels: emojis,
      matchedSymbol: reel1.emoji,
      matchCount: 3,
      multiplier,
      payout,
      profit
    };
  }

  // Check for Double Match
  if (reel1.id === reel2.id || reel2.id === reel3.id || reel1.id === reel3.id) {
    let matchedSymbol = reel1.id === reel2.id || reel1.id === reel3.id ? reel1.emoji : reel2.emoji;
    const multiplier = TWO_MATCH_MULTIPLIER;
    const payout = Math.floor(bet * multiplier);
    const profit = payout - bet;

    return {
      result: 'double',
      reels: emojis,
      matchedSymbol,
      matchCount: 2,
      multiplier,
      payout,
      profit
    };
  }

  // No match: lose bet
  return {
    result: 'lose',
    reels: emojis,
    matchedSymbol: null,
    matchCount: 0,
    multiplier: 0,
    payout: 0,
    profit: -bet
  };
}

module.exports = {
  SYMBOLS,
  TWO_MATCH_MULTIPLIER,
  spinSlots
};
