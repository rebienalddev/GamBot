/**
 * GamBot - /rps command
 */

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');
const { getUser, recordGameResult } = require('../database/database');
const { playRps, MOVES } = require('../games/rpsGame');
const { validateBet } = require('../utils/validation');
const { createBaseEmbed, createErrorEmbed, COLORS } = require('../utils/embeds');
const { acquireLock, releaseLock, formatGC } = require('../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grps')
    .setDescription('Play Rock Paper Scissors for GamCoins')
    .addIntegerOption(option =>
      option
        .setName('bet')
        .setDescription('Amount of GamCoins to wager')
        .setMinValue(1)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('choice')
        .setDescription('Your move (or choose via buttons)')
        .setRequired(false)
        .addChoices(
          { name: '🪨 Rock', value: 'rock' },
          { name: '📄 Paper', value: 'paper' },
          { name: '✂️ Scissors', value: 'scissors' }
        )
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const bet = interaction.options.getInteger('bet');
    const moveChoice = interaction.options.getString('choice');

    // Concurrency lock
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

      // If user directly passed their choice via slash options
      if (moveChoice) {
        await handleGame(interaction, userId, moveChoice, bet);
        return;
      }

      // Otherwise present interactive move buttons
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('rps_rock')
          .setLabel('Rock')
          .setEmoji('🪨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('rps_paper')
          .setLabel('Paper')
          .setEmoji('📄')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('rps_scissors')
          .setLabel('Scissors')
          .setEmoji('✂️')
          .setStyle(ButtonStyle.Primary)
      );

      const promptEmbed = createBaseEmbed(COLORS.GOLD)
        .setTitle('🪨 Rock Paper Scissors')
        .setDescription(
          `**Bet:** ${formatGC(bet)}\n\n` +
          `Choose your move below within 30 seconds!`
        );

      const response = await interaction.reply({
        embeds: [promptEmbed],
        components: [buttons],
        fetchReply: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i => i.user.id === userId,
        time: 30000,
        max: 1
      });

      collector.on('collect', async buttonInteraction => {
        const choice = buttonInteraction.customId.replace('rps_', '');
        await buttonInteraction.deferUpdate();
        await handleGame(interaction, userId, choice, bet, true);
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          releaseLock(userId);
          const timeoutEmbed = createBaseEmbed(COLORS.RED)
            .setTitle('⏳ RPS Match Expired')
            .setDescription(`You did not pick a move in time. Your **${formatGC(bet)}** bet was not deducted.`);
          await interaction.editReply({
            embeds: [timeoutEmbed],
            components: []
          }).catch(() => {});
        }
      });

    } catch (err) {
      releaseLock(userId);
      throw err;
    }
  }
};

async function handleGame(interaction, userId, userMove, bet, isButton = false) {
  try {
    const outcome = playRps(userMove, bet);

    const isWin = outcome.result === 'win';
    const isDraw = outcome.result === 'draw';

    // Record game in database atomically
    const updatedUser = await recordGameResult(userId, {
      bet,
      won: isWin,
      payout: outcome.payout,
      profit: outcome.profit,
      isDraw
    });

    let embedColor = COLORS.RED;
    let title = '💀 You Lost!';
    let profitText = `Loss: -${formatGC(bet)}`;

    if (isWin) {
      embedColor = COLORS.GREEN;
      title = '🎉 You Won!';
      profitText = `Profit: +${formatGC(outcome.profit)}`;
    } else if (isDraw) {
      embedColor = COLORS.BLUE;
      title = '🤝 It\'s a Draw!';
      profitText = 'Bet Refunded (+0 GC)';
    }

    const embed = createBaseEmbed(embedColor)
      .setTitle(`🪨 Rock Paper Scissors — ${title}`)
      .setDescription(
        `**You:** ${outcome.userChoice.emoji} ${outcome.userChoice.label}\n` +
        `**GamBot:** ${outcome.botChoice.emoji} ${outcome.botChoice.label}\n\n` +
        `💰 **${profitText}**\n` +
        `💳 **New Balance:** ${formatGC(updatedUser.balance)}`
      );

    if (isButton) {
      await interaction.editReply({
        embeds: [embed],
        components: []
      });
    } else {
      await interaction.reply({
        embeds: [embed]
      });
    }
  } finally {
    releaseLock(userId);
  }
}
