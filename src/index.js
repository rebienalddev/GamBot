/**
 * GamBot - Main Entry Point
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  ActivityType,
  Events
} = require('discord.js');

const { initDb, db, getUser, claimDaily, getLeaderboard } = require('./database/database');
const { createErrorEmbed, createDailyEmbed, createLeaderboardEmbed, createStatsEmbed } = require('./utils/embeds');

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.commands = new Collection();

// Load Commands dynamically
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] Command at ${filePath} missing "data" or "execute" property.`);
  }
}

// Client Ready Event
client.once(Events.ClientReady, async c => {
  console.log(`=========================================`);
  console.log(` GamBot is Online! Logged in as ${c.user.tag}`);
  console.log(` Serving ${c.guilds.cache.size} server(s)`);
  console.log(`=========================================`);

  // Set presence activity
  client.user.setActivity('/info | 💰 GamCoins', { type: ActivityType.Playing });

  // Initialize SQLite database tables
  try {
    await initDb();
    console.log('[DATABASE] SQLite database tables verified and initialized.');
  } catch (err) {
    console.error('[DATABASE ERROR] Failed to initialize database:', err);
  }
});

// Interaction Create Event
client.on(Events.InteractionCreate, async interaction => {
  // Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);

      const errorEmbed = createErrorEmbed(
        'Command Execution Error',
        'An unexpected error occurred while executing this command. Please try again later.'
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // Handle Quick Button Interactions (from /balance)
  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith('quick_daily_')) {
      const ownerId = customId.replace('quick_daily_', '');
      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: 'You can only use buttons from your own command menu. Run `/gdaily` directly!',
          ephemeral: true
        });
      }

      const result = await claimDaily(interaction.user.id, 1000);
      const embed = createDailyEmbed(result.claimed, result);
      return interaction.reply({ embeds: [embed], ephemeral: !result.claimed });
    }

    if (customId.startsWith('quick_leaderboard_')) {
      const topUsers = await getLeaderboard(10);
      const embed = createLeaderboardEmbed(topUsers, interaction.client);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (customId.startsWith('quick_stats_')) {
      const ownerId = customId.replace('quick_stats_', '');
      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: 'You can only use buttons from your own command menu. Run `/gstats` directly!',
          ephemeral: true
        });
      }

      const userProfile = await getUser(interaction.user.id);
      const embed = createStatsEmbed(userProfile, interaction.user);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
});

// Graceful Shutdown
function handleShutdown() {
  console.log('\nShutting down GamBot gracefully...');
  db.close(err => {
    if (err) console.error('Error closing database:', err);
    else console.log('SQLite database connection closed.');
    client.destroy();
    process.exit(0);
  });
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token || token.trim() === '') {
  console.log('[CONFIG] No DISCORD_TOKEN found in .env. Please configure your bot token in .env');
} else {
  client.login(token).catch(err => {
    console.error('[LOGIN ERROR] Failed to connect to Discord:', err.message);
  });
}
