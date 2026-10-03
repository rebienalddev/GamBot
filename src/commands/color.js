/**
 * GamBot - /color command
 */

const { SlashCommandBuilder } = require('discord.js');
const { getUser, recordGameResult } = require('../database/database');
const { spinColorWheel, WHEEL_COLORS } = require('../games/colorGame');
const { validateBet } = require('../utils/validation');
const { createBaseEmbed, createErrorEmbed, COLORS } = require('../utils/embeds');
const { acquireLock, releaseLock, formatGC } = require('../utils/economy');

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gcolor')
    .setDescription('Spin the Color Wheel with weighted odds and big multiplier payouts!')
    .addIntegerOption(option =>
      option
        .setName('bet')
        .setDescription('Amount of GamCoins to wager')
        .setMinValue(1)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('color')
        .setDescription('Choose a color to bet on')
        .setRequired(true)
        .addChoices(
          { name: '🔴 Red (30% chance, 2.0x payout)', value: 'red' },
          { name: '🔵 Blue (25% chance, 2.5x payout)', value: 'blue' },
          { name: '🟢 Green (20% chance, 3.0x payout)', value: 'green' },
          { name: '🟡 Yellow (15% chance, 4.0x payout)', value: 'yellow' },
          { name: '🟣 Purple (10% chance, 6.0x payout)', value: 'purple' }
        )
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const bet = interaction.options.getInteger('bet');
    const colorChoice = interaction.options.getString('color');

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

      const selected = WHEEL_COLORS[colorChoice];

      // Display initial spinning animation embed
      const spinningEmbed = createBaseEmbed(COLORS.GOLD)
        .setTitle('🎡 Color Wheel')
        .setDescription(
          `**Your Choice:** ${selected.emoji} **${selected.name}** (${selected.multiplier}x payout)\n` +
          `**Bet:** ${formatGC(bet)}\n\n` +
          `🎡 *The wheel is spinning...* 🔴 🔵 🟢 🟡 🟣`
        );

      await interaction.reply({
        embeds: [spinningEmbed]
      });

      // Brief animation pause
      await delay(1200);

      // Compute spin result
      const outcome = spinColorWheel(colorChoice, bet);
      const isWin = outcome.result === 'win';

      // Update database atomically
      const updatedUser = await recordGameResult(userId, {
        bet,
        won: isWin,
        payout: outcome.payout,
        profit: outcome.profit,
        isDraw: false
      });

      const embedColor = isWin ? COLORS.GREEN : COLORS.RED;
      const title = isWin ? '🎉 You Won!' : '💀 You Lost!';
      const profitText = isWin
        ? `Profit: +${formatGC(outcome.profit)} (Total Payout: ${formatGC(outcome.payout)})`
        : `Loss: -${formatGC(bet)}`;

      const finalEmbed = createBaseEmbed(embedColor)
        .setTitle(`🎡 Color Wheel — ${title}`)
        .setDescription(
          `**Your Choice:** ${outcome.userColor.emoji} **${outcome.userColor.name}**\n` +
          `**Wheel Landed On:** ${outcome.landedColor.emoji} **${outcome.landedColor.name}**\n\n` +
          `💰 **${profitText}**\n` +
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
