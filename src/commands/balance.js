/**
 * GamBot - /balance command
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser } = require('../database/database');
const { createBalanceEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gbalance')
    .setDescription('Check your or another user\'s GamCoins balance')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user whose balance you want to check')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const isSelf = targetUser.id === interaction.user.id;

    const userProfile = await getUser(targetUser.id);
    const embed = createBalanceEmbed(userProfile, targetUser, isSelf);

    // Interactive buttons for quick navigation
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quick_daily_${interaction.user.id}`)
        .setLabel('Daily Reward')
        .setEmoji('🎁')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quick_leaderboard_${interaction.user.id}`)
        .setLabel('Leaderboard')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quick_stats_${interaction.user.id}`)
        .setLabel('My Stats')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [buttons]
    });
  }
};
