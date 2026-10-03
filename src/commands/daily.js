/**
 * GamBot - /daily command
 */

const { SlashCommandBuilder } = require('discord.js');
const { claimDaily } = require('../database/database');
const { createDailyEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gdaily')
    .setDescription('Claim your daily reward of 1,000 GamCoins once every 24 hours'),

  async execute(interaction) {
    const result = await claimDaily(interaction.user.id, 1000);
    const embed = createDailyEmbed(result.claimed, result);

    await interaction.reply({
      embeds: [embed],
      ephemeral: !result.claimed // Ephemeral if in cooldown to keep chat clean
    });
  }
};
