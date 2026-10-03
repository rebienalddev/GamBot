# 🎲 GamBot

**GamBot** is a fun, polished, and modular Discord economy and gambling bot inspired by OWO. It features rich Discord embeds, interactive buttons, animated game actions, and an atomic SQLite persistence system.

> ⚠️ **Disclaimer:** All currency in GamBot (**GamCoins / GC**) is **completely fictional and has NO real-world monetary value**. It is intended strictly for entertainment and educational purposes. No real money, payment gateways, or cryptocurrencies are used or supported.

---

## 🚀 Features

- **💰 Fictional Economy:**
  - Starting bonus of **1,000 GamCoins (GC)** for every new player.
  - `/gbalance`: View wallet and quick-access buttons.
  - `/gdaily`: Claim free GamCoins once every 24 hours.
  - `/ggive`: Safe, atomic peer-to-peer coin transfers.
  - `/gleaderboard`: Global server wealth rankings.
  - `/gstats`: In-depth win/loss ratio, net profit, and record streaks.

- **🎮 Four Polish Gambling Games:**
  - **🪨 Rock Paper Scissors (`/grps`)**: Pick your move with slash options or interactive buttons. Win 2× payout!
  - **🎲 Dice Guess (`/gdice`)**: Guess numbers 1–6 for a 5× payout.
  - **🎰 3-Reel Slots (`/gslots`)**: Animated slot reels with configurable weights and up to 10× jackpot.
  - **🎡 Color Wheel (`/gcolor`)**: Animated wheel spin with weighted probabilities (Red, Blue, Green, Yellow, Purple) and up to 6× payout.

- **🛡️ Concurrency & Exploitation Protection:**
  - Per-user concurrency locking prevents double-spend and race condition exploits.
  - Strict validation rejects 0, negative bets, decimals, or amounts exceeding wallet balance.
  - Atomic SQLite database transactions ensure balances never desync or turn negative.

---

## 📁 Project Structure

```text
GamBot/
├── src/
│   ├── commands/             # Discord Slash Command Handlers
│   │   ├── balance.js        # /gbalance [user]
│   │   ├── daily.js          # /gdaily
│   │   ├── give.js           # /ggive <user> <amount>
│   │   ├── leaderboard.js    # /gleaderboard
│   │   ├── stats.js          # /gstats [user]
│   │   ├── rps.js            # /grps <bet> [choice]
│   │   ├── dice.js           # /gdice <bet> <number>
│   │   ├── slots.js          # /gslots <bet>
│   │   ├── color.js          # /gcolor <bet> <color>
│   │   ├── info.js           # /ginfo
│   │   └── help.js           # /ghelp
│   │
│   ├── games/                # Modular Game Engines (Separate from Discord API)
│   │   ├── rpsGame.js        # Rock-Paper-Scissors engine
│   │   ├── diceGame.js       # Dice roll engine
│   │   ├── slotsGame.js      # Slots spin & jackpot engine
│   │   └── colorGame.js      # Weighted color wheel engine
│   │
│   ├── database/             # SQLite Data Layer
│   │   └── database.js       # User profiles, transactions, and stats
│   │
│   ├── utils/                # Helper Utilities
│   │   ├── economy.js        # Concurrency locks, formatting
│   │   ├── embeds.js         # Standardized Discord Embed builders
│   │   └── validation.js     # Bet input & balance validators
│   │
│   ├── deploy-commands.js    # Slash command registration script
│   └── index.js              # Bot entry point & client event handlers
│
├── data/                     # Auto-created SQLite database directory
│   └── gambot.db
├── .env                      # Your private bot credentials
├── .env.example              # Example environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- A **Discord Bot Token** from the [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_ID=your_test_server_id_here  # Optional: for instant server updates, leave blank for global
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Register Slash Commands
Run the command deployment script:
```bash
npm run deploy
```

### 5. Launch GamBot
```bash
npm start
```

Or run 24/7 as a background systemd user service:
```bash
systemctl --user start gambot
```

---

## 📖 Command Guide & Examples

### 💰 Economy Commands

| Command | Arguments | Description |
|---|---|---|
| `/gbalance` | `[user]` | View your or another member's GamCoins wallet |
| `/gdaily` | None | Claim your daily 1,000 GC reward (24h cooldown) |
| `/ggive` | `<user>` `<amount>` | Send GamCoins to another server member |
| `/gleaderboard` | None | Display the top 10 richest players |
| `/gstats` | `[user]` | View games played, win rate, and biggest win |
| `/ginfo` / `/ghelp` | None | View all games, rules, and payouts |

---

### 🎮 Gambling Games

#### 1. Rock Paper Scissors (`/grps`)
- **Usage:** `/grps <bet> [choice]`
- **Choices:** 🪨 Rock, 📄 Paper, ✂️ Scissors
- If choice is omitted, interactive buttons appear to make your move!
- **Payout:**
  - Win: **2× total returned** (+1× profit)
  - Draw: **Refund bet** (+0 GC)
  - Lose: **Lose bet**

#### 2. Dice Roll (`/gdice`)
- **Usage:** `/gdice <bet> <number: 1-6>`
- Guess which number the 6-sided die will roll.
- **Payout:** **5× total payout** (+4× profit) on exact match.

#### 3. 3-Reel Slots (`/gslots`)
- **Usage:** `/gslots <bet>`
- Features reel spin animation and weighted symbol payouts:
  - 3× 7️⃣ → **10× payout** (Jackpot)
  - 3× 💎 → **8× payout**
  - 3× ⭐ → **6× payout**
  - 3× 🍒 → **5× payout**
  - 3× 🍋 → **4× payout**
  - 3× 🍊 → **3× payout**
  - 3× 🍉 → **3× payout**
  - Any 2 matching symbols → **1.5× payout**

#### 4. Color Wheel (`/gcolor`)
- **Usage:** `/gcolor <bet> <color>`
- Features spinning animation and weighted wheel probabilities:
  - 🔴 **Red** (30% chance) → **2.0× payout** (+1.0× profit)
  - 🔵 **Blue** (25% chance) → **2.5× payout** (+1.5× profit)
  - 🟢 **Green** (20% chance) → **3.0× payout** (+2.0× profit)
  - 🟡 **Yellow** (15% chance) → **4.0× payout** (+3.0× profit)
  - 🟣 **Purple** (10% chance) → **6.0× payout** (+5.0× profit)
