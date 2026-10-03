/**
 * GamBot - /give command
 */

const { SlashCommandBuilder } = require('discord.js');
const { getUser, transferCoins } = require('../database/database');
const { validateBet } = require('../utils/validation');
const { createErrorEmbed, createTransferEmbed } = require('../utils/embeds');
const { acquireLock, releaseLock } = require('../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ggive')
    .setDescription('Transfer GamCoins to another user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The recipient user')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('The amount of GamCoins to send')
        .setMinValue(1)
        .setRequired(true)
    ),

  async execute(interaction) {
    const senderId = interaction.user.id;
    const recipient = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    // Reject sending to self
    if (recipient.id === senderId) {
      return interaction.reply({
        embeds: [createErrorEmbed('Self Transfer Forbidden', 'You cannot send GamCoins to yourself!')],
        ephemeral: true
      });
    }

    // Reject sending to bot
    if (recipient.bot) {
      return interaction.reply({
        embeds: [createErrorEmbed('Bot Transfer Forbidden', 'You cannot send GamCoins to Discord bots!')],
        ephemeral: true
      });
    }

    // Acquire lock
    if (!acquireLock(senderId)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Transaction In Progress', 'You already have an active game or transaction in progress. Please wait!')],
        ephemeral: true
      });
    }

    try {
      const sender = await getUser(senderId);
      const validation = validateBet(amount, sender.balance);

      if (!validation.valid) {
        return interaction.reply({
          embeds: [createErrorEmbed('Insufficient GamCoins', validation.error)],
          ephemeral: true
        });
      }

      const result = await transferCoins(senderId, recipient.id, amount);

      if (!result.success) {
        return interaction.reply({
          embeds: [createErrorEmbed('Transfer Failed', 'An error occurred or your balance changed before the transfer.')],
          ephemeral: true
        });
      }

      const updatedSender = await getUser(senderId);
      const embed = createTransferEmbed(interaction.user, recipient, amount, updatedSender.balance);

      await interaction.reply({
        embeds: [embed]
      });
    } finally {
      releaseLock(senderId);
    }
  }
};
