/**
 * GamBot - /ginfo command
 */

const { SlashCommandBuilder } = require('discord.js');
const { createBaseEmbed, COLORS } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ginfo')
    .setDescription('View all GamBot commands, games, and rules'),

  async execute(interaction) {
    const embed = createBaseEmbed(COLORS.GOLD)
      .setTitle('🎲 GamBot Command Guide')
      .setDescription(
        'Welcome to **GamBot**, the virtual gambling and economy bot!\n' +
        'All currency (**GamCoins - GC**) is completely fictional with **no real-world monetary value**.\n'
      )
      .addFields(
        {
          name: '💰 Economy Commands',
          value:
            '`/gbalance [user]` — Check your or another player\'s balance\n' +
            '`/gdaily` — Claim free daily GamCoins every 24 hours\n' +
            '`/ggive <user> <amount>` — Send GamCoins to another user\n' +
            '`/gleaderboard` — View the top 10 richest players\n' +
            '`/gstats [user]` — Check win rates and gambling history\n' +
            '`/ginfo` or `/ghelp` — View all commands and rules'
        },
        {
          name: '🎮 Gambling Games',
          value:
            '`/grps <bet> [choice]` — Rock Paper Scissors (2x payout)\n' +
            '`/gdice <bet> <1-6>` — Guess the die roll (5x payout)\n' +
            '`/gslots <bet>` — Spin the 3-reel slot machine (up to 10x)\n' +
            '`/gcolor <bet> <color>` — Color wheel with weighted odds (up to 6x)'
        },
        {
          name: '🛡️ Fair Play & Security',
          value:
            '• Bets must be whole positive integers\n' +
            '• Bets cannot exceed your available balance\n' +
            '• Concurrency locks prevent double-betting race conditions'
        }
      );

    await interaction.reply({
      embeds: [embed]
    });
  }
};
