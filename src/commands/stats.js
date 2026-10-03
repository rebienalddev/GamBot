/**
 * GamBot - /stats command
 */

const { SlashCommandBuilder } = require('discord.js');
const { getUser } = require('../database/database');
const { createStatsEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gstats')
    .setDescription('View your or another user\'s gambling statistics')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user whose statistics you want to view')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userProfile = await getUser(targetUser.id);
    const embed = createStatsEmbed(userProfile, targetUser);

    await interaction.reply({
      embeds: [embed]
    });
  }
};
