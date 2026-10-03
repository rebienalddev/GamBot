/**
 * GamBot - /dice command
 */

const { SlashCommandBuilder } = require('discord.js');
const { getUser, recordGameResult } = require('../database/database');
const { playDice } = require('../games/diceGame');
const { validateBet } = require('../utils/validation');
const { createBaseEmbed, createErrorEmbed, COLORS } = require('../utils/embeds');
const { acquireLock, releaseLock, formatGC } = require('../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gdice')
    .setDescription('Roll a 6-sided die. Guess the number correctly for a 5x payout!')
    .addIntegerOption(option =>
      option
        .setName('bet')
        .setDescription('Amount of GamCoins to wager')
        .setMinValue(1)
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('number')
        .setDescription('Choose a number between 1 and 6')
        .setMinValue(1)
        .setMaxValue(6)
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const bet = interaction.options.getInteger('bet');
    const guess = interaction.options.getInteger('number');

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

      // Roll dice
      const outcome = playDice(guess, bet);
      const isWin = outcome.result === 'win';

      // Record in database
      const updatedUser = await recordGameResult(userId, {
        bet,
        won: isWin,
        payout: outcome.payout,
        profit: outcome.profit,
        isDraw: false
      });

      const embedColor = isWin ? COLORS.GREEN : COLORS.RED;
      const title = isWin ? '🎉 You Guessed Correctly!' : '💀 Wrong Guess!';
      const profitText = isWin
        ? `Won: +${formatGC(outcome.profit)} (Total Payout: ${formatGC(outcome.payout)})`
        : `Loss: -${formatGC(bet)}`;

      const embed = createBaseEmbed(embedColor)
        .setTitle(`🎲 Dice Roll — ${title}`)
        .setDescription(
          `**Your Number:** ${outcome.userEmoji} **${outcome.userNumber}**\n` +
          `**Rolled:** ${outcome.rolledEmoji} **${outcome.rolledNumber}**\n\n` +
          `💰 **${profitText}**\n` +
          `💳 **New Balance:** ${formatGC(updatedUser.balance)}`
        );

      await interaction.reply({
        embeds: [embed]
      });
    } finally {
      releaseLock(userId);
    }
  }
};
