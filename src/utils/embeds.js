/**
 * GamBot - Discord Embed Builders
 */

const { EmbedBuilder } = require('discord.js');
const { formatGC } = require('./economy');

const COLORS = {
  GOLD: 0xF1C40F,
  GREEN: 0x2ECC71,
  RED: 0xE74C3C,
  BLUE: 0x3498DB,
  PURPLE: 0x9B59B6,
  DARK: 0x2B2D31
};

const FOOTER_TEXT = 'GamBot • Fictional Currency (No Real Value)';

function createBaseEmbed(color = COLORS.GOLD) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

function createErrorEmbed(title, description) {
  return createBaseEmbed(COLORS.RED)
    .setTitle(`❌ ${title}`)
    .setDescription(description);
}

function createBalanceEmbed(user, targetUser, isSelf = true) {
  const title = isSelf ? 'Your Wallet' : `${targetUser.username}'s Wallet`;
  return createBaseEmbed(COLORS.GOLD)
    .setAuthor({
      name: title,
      iconURL: targetUser.displayAvatarURL({ dynamic: true })
    })
    .setDescription(`💰 **GamCoins:** ${formatGC(user.balance)}`)
    .addFields(
      { name: '🎮 Games Played', value: `${user.gamesPlayed || 0}`, inline: true },
      { name: '🏆 Games Won', value: `${user.gamesWon || 0}`, inline: true },
      { name: '📈 Biggest Win', value: formatGC(user.biggestWin || 0), inline: true }
    );
}

function createDailyEmbed(claimed, { reward, newBalance, remainingMs, nextDailyTimestamp }) {
  if (!claimed) {
    return createBaseEmbed(COLORS.BLUE)
      .setTitle('⏳ Daily Reward Cooldown')
      .setDescription(
        `You have already claimed your daily GamCoins today!\n\n` +
        `Come back <t:${nextDailyTimestamp}:R> to claim your next reward.`
      );
  }

  return createBaseEmbed(COLORS.GREEN)
    .setTitle('🎁 Daily Reward Claimed!')
    .setDescription(
      `You received **+${formatGC(reward)}**!\n\n` +
      `💰 **New Balance:** ${formatGC(newBalance)}\n` +
      `*Claim again in 24 hours!*`
    );
}

function createTransferEmbed(sender, recipient, amount, senderNewBalance) {
  return createBaseEmbed(COLORS.GREEN)
    .setTitle('💸 Transfer Successful')
    .setDescription(
      `Successfully sent **${formatGC(amount)}** to <@${recipient.id}>!`
    )
    .addFields(
      { name: 'Sender', value: `<@${sender.id}>`, inline: true },
      { name: 'Recipient', value: `<@${recipient.id}>`, inline: true },
      { name: 'Remaining Balance', value: formatGC(senderNewBalance), inline: true }
    );
}

function createLeaderboardEmbed(topUsers, client) {
  const embed = createBaseEmbed(COLORS.GOLD)
    .setTitle('🏆 GamBot Global Leaderboard')
    .setDescription('The wealthiest high-rollers in the server:');

  if (topUsers.length === 0) {
    embed.setDescription('No users have played yet. Use `/daily` or play games to climb the ranks!');
    return embed;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const lines = topUsers.map((u, i) => {
    const medal = medals[i] || `\`#${i + 1}\``;
    return `${medal} <@${u.userId}> — **${formatGC(u.balance)}** (Wins: ${u.gamesWon})`;
  });

  embed.addFields({ name: 'Rankings', value: lines.join('\n') });
  return embed;
}

function createStatsEmbed(user, discordUser) {
  const winRate = user.gamesPlayed > 0 
    ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1) 
    : '0.0';

  const netProfit = (user.totalWon || 0) - (user.totalLost || 0);
  const netPrefix = netProfit >= 0 ? '+' : '';

  return createBaseEmbed(COLORS.BLUE)
    .setAuthor({
      name: `${discordUser.username}'s GamBot Statistics`,
      iconURL: discordUser.displayAvatarURL({ dynamic: true })
    })
    .addFields(
      { name: '💰 Current Balance', value: formatGC(user.balance), inline: true },
      { name: '🎮 Games Played', value: `${user.gamesPlayed}`, inline: true },
      { name: '🎯 Win Rate', value: `${winRate}%`, inline: true },
      { name: '🏆 Wins', value: `${user.gamesWon}`, inline: true },
      { name: '💀 Losses', value: `${user.gamesLost}`, inline: true },
      { name: '📊 Net Profit', value: `${netPrefix}${formatGC(netProfit)}`, inline: true },
      { name: '💸 Total Wagered', value: formatGC(user.totalWagered), inline: true },
      { name: '📈 Biggest Win', value: formatGC(user.biggestWin), inline: true },
      { name: '🎲 Biggest Bet', value: formatGC(user.biggestBet), inline: true }
    );
}

module.exports = {
  COLORS,
  FOOTER_TEXT,
  createBaseEmbed,
  createErrorEmbed,
  createBalanceEmbed,
  createDailyEmbed,
  createTransferEmbed,
  createLeaderboardEmbed,
  createStatsEmbed
};
