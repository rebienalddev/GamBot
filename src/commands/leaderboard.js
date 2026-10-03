/**
 * GamBot - /leaderboard command
 */

const { SlashCommandBuilder } = require('discord.js');
const { getLeaderboard } = require('../database/database');
const { createLeaderboardEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gleaderboard')
    .setDescription('View the top 10 richest GamCoins holders'),

  async execute(interaction) {
    const topUsers = await getLeaderboard(10);
    const embed = createLeaderboardEmbed(topUsers, interaction.client);

    await interaction.reply({
      embeds: [embed]
    });
  }
};
