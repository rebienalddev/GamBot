/**
 * GamBot - /slots command
 */

const { SlashCommandBuilder } = require('discord.js');
const { getUser, recordGameResult } = require('../database/database');
const { spinSlots } = require('../games/slotsGame');
const { validateBet } = require('../utils/validation');
const { createBaseEmbed, createErrorEmbed, COLORS } = require('../utils/embeds');
const { acquireLock, releaseLock, formatGC } = require('../utils/economy');

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gslots')
    .setDescription('Spin the slot machine for big multiplier payouts!')
    .addIntegerOption(option =>
      option
        .setName('bet')
        .setDescription('Amount of GamCoins to wager')
        .setMinValue(1)
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const bet = interaction.options.getInteger('bet');

    if (!acquireLock(userId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Game In Progress', 'You already have an active game in progress. Finish it first!')],
        ephemeral: true
      });
    }

    try {
      const user = await getUser(userId);
      const validation = validateBet(bet, user.balance);

      if (!validation.valid) {
        releaseLock(userId);
        return interaction.reply({
          embeds: [createErrorEmbed('Insufficient GamCoins', validation.error)],
          ephemeral: true
        });
      }

      // Display initial spinning animation embed
      const spinningEmbed = createBaseEmbed(COLORS.GOLD)
        .setTitle('🎰 GamBot Slots')
        .setDescription(
          `**Bet:** ${formatGC(bet)}\n\n` +
          `[ 🌀 | 🌀 | 🌀 ]\n\n` +
          `*Spinning the reels...*`
        );

      await interaction.reply({
        embeds: [spinningEmbed]
      });

      // Brief animation pause
      await delay(1200);

      // Compute spin result
      const outcome = spinSlots(bet);
      const isWin = outcome.result === 'jackpot' || outcome.result === 'double';

      // Update database atomically
      const updatedUser = await recordGameResult(userId, {
        bet,
        won: isWin,
        payout: outcome.payout,
        profit: outcome.profit,
        isDraw: false
      });

      let embedColor = COLORS.RED;
      let title = '💀 No Match!';
      let resultText = `Loss: -${formatGC(bet)}`;

      if (outcome.result === 'jackpot') {
        embedColor = COLORS.GREEN;
        title = `🎉 JACKPOT (${outcome.multiplier}x Payout)!`;
        resultText = `Won: +${formatGC(outcome.profit)} (Total: ${formatGC(outcome.payout)})`;
      } else if (outcome.result === 'double') {
        embedColor = COLORS.BLUE;
        title = `✨ Double Match (${outcome.multiplier}x Payout)!`;
        resultText = `Won: +${formatGC(outcome.profit)} (Total: ${formatGC(outcome.payout)})`;
      }

      const [r1, r2, r3] = outcome.reels;

      const finalEmbed = createBaseEmbed(embedColor)
        .setTitle(`🎰 GamBot Slots — ${title}`)
        .setDescription(
          `**Bet:** ${formatGC(bet)}\n\n` +
          `╔═════════════╗\n` +
          `║  ${r1}  |  ${r2}  |  ${r3}  ║\n` +
          `╚═════════════╝\n\n` +
          `💰 **${resultText}**\n` +
          `💳 **New Balance:** ${formatGC(updatedUser.balance)}`
        );

      await interaction.editReply({
        embeds: [finalEmbed]
      });

    } finally {
      releaseLock(userId);
    }
  }
};
